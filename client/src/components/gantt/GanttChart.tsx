import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInSeconds, format } from "date-fns";
import html2canvas from "html2canvas";
import type { Epic } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Timeline } from "@/components/gantt/Timeline";
import {
  fetchJiraEpics,
  fetchJiraTasks,
  updateTaskDates,
} from "@/lib/jira-api";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  GANTT_HEADER_HEIGHT,
  GANTT_MIN_HEIGHT,
  GANTT_SCROLL_HEIGHT,
  GANTT_ZOOM_DEFAULT,
} from "@/components/gantt/constants";
import { GanttTaskCanvas } from "@/components/gantt/GanttTaskCanvas";
import { GanttTaskList } from "@/components/gantt/GanttTaskList";
import { GanttToolbar } from "@/components/gantt/GanttToolbar";
import {
  buildInitialTaskOrder,
  createDefaultDateRange,
  createExportDateRange,
  getChartHeight,
  groupTasksByEpic,
  moveTaskWithinEpic,
  shiftDateRange,
  zoomDateRange,
} from "@/components/gantt/utils";
import type { JiraTask } from "@/types/jira";

const EMPTY_EPICS: Epic[] = [];
const EMPTY_TASKS: JiraTask[] = [];

export function GanttChart() {
  const initialDateRange = createDefaultDateRange();
  const exportRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [zoom, setZoom] = useState(GANTT_ZOOM_DEFAULT);
  const [taskOrder, setTaskOrder] = useState<Record<number, number>>({});
  const [customProjectEndDate, setCustomProjectEndDate] = useState<
    Date | undefined
  >();
  const baseDuration = differenceInSeconds(initialDateRange.end, initialDateRange.start);
  const queryClient = useQueryClient();

  const { data: epicsData, isLoading: epicsLoading } = useQuery<Epic[]>({
    queryKey: ["epics"],
    queryFn: () => fetchJiraEpics(),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<JiraTask[]>({
    queryKey: ["tasks"],
    queryFn: () => fetchJiraTasks(),
  });

  const epics = epicsData ?? EMPTY_EPICS;
  const tasks = tasksData ?? EMPTY_TASKS;

  useEffect(() => {
    if (tasks.length) {
      setTaskOrder(buildInitialTaskOrder(tasks));
      return;
    }

    setTaskOrder({});
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async (data: {
      taskId: number;
      startDate: Date;
      endDate: Date;
    }) => updateTaskDates(data.taskId, data.startDate, data.endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (epicsLoading || tasksLoading) {
    return <div>Loading...</div>;
  }

  const groups = groupTasksByEpic(epics, tasks, taskOrder);
  const chartHeight = getChartHeight(groups);
  const projectEndDate =
    customProjectEndDate ??
    tasks.reduce<Date | undefined>((latest, task) => {
      const taskEnd = new Date(task.endDate);
      return latest && latest > taskEnd ? latest : taskEnd;
    }, undefined);

  return (
    <Card
      className="w-full"
      style={
        {
          "--gantt-chart-min-height": `${GANTT_MIN_HEIGHT}px`,
          "--gantt-scroll-height": `${GANTT_SCROLL_HEIGHT}px`,
          "--gantt-header-height": `${GANTT_HEADER_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <GanttToolbar
          zoom={zoom}
          onBack={() => setDateRange((current) => shiftDateRange(current, -1, zoom))}
          onForward={() =>
            setDateRange((current) => shiftDateRange(current, 1, zoom))
          }
          onZoomChange={(nextZoom) => {
            setDateRange((current) => zoomDateRange(current, nextZoom, baseDuration));
            setZoom(nextZoom);
          }}
          onExport={async () => {
            const exportDateRange = createExportDateRange(tasks);
            if (!exportDateRange || !exportRef.current) {
              return;
            }

            const previousDateRange = dateRange;
            setDateRange(exportDateRange);
            await new Promise((resolve) => setTimeout(resolve, 100));

            try {
              const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                useCORS: true,
                width: exportRef.current.scrollWidth,
                height: exportRef.current.scrollHeight,
                scrollX: exportRef.current.scrollLeft,
                scrollY: exportRef.current.scrollTop,
                windowHeight: exportRef.current.clientHeight,
                windowWidth: exportRef.current.clientWidth,
                allowTaint: false,
                foreignObjectRendering: false,
              });

              const link = document.createElement("a");
              link.download = `gantt-chart-${format(new Date(), "yyyy-MM-dd")}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
            } catch (error) {
              console.error("Failed to export chart:", error);
            } finally {
              setDateRange(previousDateRange);
            }
          }}
        />

        <div className="overflow-auto rounded-xl border bg-background/70 shadow-inner max-h-[var(--gantt-scroll-height)]">
          <div ref={exportRef} className="p-3">
        <ResizablePanelGroup
          direction="horizontal"
              className="min-h-[var(--gantt-chart-min-height)]"
        >
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={50}
                className="pr-3"
          >
                <div
                  className="border-b border-border/60"
                  style={{ height: GANTT_HEADER_HEIGHT }}
                />
                <GanttTaskList groups={groups} />
          </ResizablePanel>

              <ResizableHandle withHandle className="h-auto" />

          <ResizablePanel
            defaultSize={75}
                className="overflow-hidden pl-3"
          >
                <div
                  className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur"
                  style={{ height: GANTT_HEADER_HEIGHT }}
                >
                  <Timeline
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    zoom={zoom}
                  />
                </div>

                <GanttTaskCanvas
                  groups={groups}
                  chartHeight={chartHeight}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  projectEndDate={projectEndDate}
                  onProjectEndDateChange={setCustomProjectEndDate}
                  onTaskUpdate={(taskId, startDate, endDate) =>
                    updateTaskMutation.mutate({ taskId, startDate, endDate })
                  }
                  onTaskOrderChange={(task, newIndex) => {
                    setTaskOrder((current) =>
                      moveTaskWithinEpic(tasks, current, task.id, task.epicId, newIndex),
                    );
                  }}
                />
          </ResizablePanel>
        </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </Card>
  );
}
