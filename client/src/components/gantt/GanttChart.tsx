import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInSeconds, format } from "date-fns";
import html2canvas from "html2canvas";
import type { Epic } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Timeline } from "@/components/gantt/Timeline";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { createDemoGanttData } from "@/components/gantt/demo-data";
import { GanttTaskCanvas } from "@/components/gantt/GanttTaskCanvas";
import { GanttTaskList } from "@/components/gantt/GanttTaskList";
import { GanttToolbar } from "@/components/gantt/GanttToolbar";
import {
  buildInitialTaskOrder,
  createTaskOrderStorageKey,
  createDefaultDateRange,
  createExportDateRange,
  getChartHeight,
  groupTasksByEpic,
  moveTaskWithinEpic,
  readTaskOrderStorage,
  syncTaskOrder,
  shiftDateRange,
  writeTaskOrderStorage,
  zoomDateRange,
} from "@/components/gantt/utils";
import type { JiraTask } from "@/types/jira";

const EMPTY_EPICS: Epic[] = [];
const EMPTY_TASKS: JiraTask[] = [];

export function GanttChart() {
  const demoDataRef = useRef(createDemoGanttData());
  const initialDateRange = createDefaultDateRange();
  const baseDuration = differenceInSeconds(initialDateRange.end, initialDateRange.start);
  const exportRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState(() =>
    zoomDateRange(initialDateRange, GANTT_ZOOM_DEFAULT, baseDuration),
  );
  const [zoom, setZoom] = useState(GANTT_ZOOM_DEFAULT);
  const [taskOrder, setTaskOrder] = useState<Record<number, number>>({});
  const [demoTasks, setDemoTasks] = useState(() => demoDataRef.current.tasks);
  const [isExporting, setIsExporting] = useState(false);
  const [customProjectEndDate, setCustomProjectEndDate] = useState<
    Date | undefined
  >();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const {
    data: epicsData,
    isLoading: epicsLoading,
    isError: epicsError,
  } = useQuery<Epic[]>({
    queryKey: ["epics"],
    queryFn: () => fetchJiraEpics(),
    retry: false,
  });

  const {
    data: tasksData,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useQuery<JiraTask[]>({
    queryKey: ["tasks"],
    queryFn: () => fetchJiraTasks(),
    retry: false,
  });

  const epics = epicsData ?? EMPTY_EPICS;
  const tasks = tasksData ?? EMPTY_TASKS;
  const usingDemoData =
    epicsError ||
    tasksError ||
    epics.length === 0 ||
    tasks.length === 0;
  const activeEpics = usingDemoData ? demoDataRef.current.epics : epics;
  const activeTasks = usingDemoData ? demoTasks : tasks;
  const taskOrderStorageKey = createTaskOrderStorageKey(
    activeTasks,
    usingDemoData ? "demo" : "imported",
  );

  useEffect(() => {
    setTaskOrder((current) => {
      if (!activeTasks.length) {
        return {};
      }

      const savedOrder = readTaskOrderStorage(taskOrderStorageKey);
      if (savedOrder && Object.keys(savedOrder).length > 0) {
        return syncTaskOrder(savedOrder, activeTasks);
      }

      if (Object.keys(current).length === 0) {
        return buildInitialTaskOrder(activeTasks);
      }

      return syncTaskOrder(current, activeTasks);
    });
  }, [activeTasks, taskOrderStorageKey]);

  useEffect(() => {
    if (!activeTasks.length || Object.keys(taskOrder).length === 0) {
      return;
    }

    writeTaskOrderStorage(taskOrderStorageKey, taskOrder);
  }, [activeTasks.length, taskOrder, taskOrderStorageKey]);

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

  const groups = groupTasksByEpic(activeEpics, activeTasks, taskOrder);
  const chartHeight = getChartHeight(groups);
  const projectEndDate =
    customProjectEndDate ??
    activeTasks.reduce<Date | undefined>((latest, task) => {
      const taskEnd = new Date(task.endDate);
      return latest && latest > taskEnd ? latest : taskEnd;
    }, undefined);
  const waitForNextPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  return (
    <Card
      className="neo-surface w-full overflow-hidden border-white/60 bg-transparent"
      style={
        {
          "--gantt-chart-min-height": `${GANTT_MIN_HEIGHT}px`,
          "--gantt-scroll-height": `${GANTT_SCROLL_HEIGHT}px`,
          "--gantt-header-height": `${GANTT_HEADER_HEIGHT}px`,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-5 p-5">
        {usingDemoData && (
          <div className="neo-inset flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-5 py-4">
            <div className="space-y-1">
              <div className="neo-badge w-fit">Demo Mode</div>
              <p className="text-sm font-medium text-foreground">
                Sample roadmap loaded automatically.
              </p>
              <p className="text-sm text-muted-foreground">
                Upload a CSV at any time to replace it with imported work.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{activeEpics.length} epics</span>
              <span>{activeTasks.length} tasks</span>
            </div>
          </div>
        )}

        <GanttToolbar
          zoom={zoom}
          isExporting={isExporting}
          taskCount={activeTasks.length}
          epicCount={activeEpics.length}
          modeLabel={usingDemoData ? "Demo timeline" : "Imported timeline"}
          onBack={() => setDateRange((current) => shiftDateRange(current, -1, zoom))}
          onForward={() =>
            setDateRange((current) => shiftDateRange(current, 1, zoom))
          }
          onZoomChange={(nextZoom) => {
            setDateRange((current) => zoomDateRange(current, nextZoom, baseDuration));
            setZoom(nextZoom);
          }}
          onExport={async () => {
            if (isExporting) {
              return;
            }

            const exportDateRange = createExportDateRange(activeTasks);
            if (!exportDateRange || !exportRef.current) {
              return;
            }

            const previousDateRange = dateRange;
            setIsExporting(true);
            flushSync(() => setDateRange(exportDateRange));
            await waitForNextPaint();

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
              flushSync(() => setDateRange(previousDateRange));
              setIsExporting(false);
            }
          }}
        />

        <div className="neo-inset overflow-auto rounded-[28px] p-3 max-h-[var(--gantt-scroll-height)]">
          <div ref={exportRef} className="neo-grid rounded-[24px] p-3">
            <ResizablePanelGroup
              direction={isMobile ? "vertical" : "horizontal"}
              className="min-h-[var(--gantt-chart-min-height)] items-stretch"
            >
              <ResizablePanel
                defaultSize={isMobile ? 40 : 25}
                minSize={isMobile ? 25 : 15}
                maxSize={isMobile ? 60 : 50}
                className={isMobile ? "pb-3" : "pr-3"}
              >
                <div
                  className="grid h-full grid-cols-[minmax(0,1fr)_4.75rem] items-center gap-x-3 rounded-[20px] border border-white/45 bg-transparent px-4 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:gap-x-5"
                  style={{ height: GANTT_HEADER_HEIGHT }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Ticket
                  </p>
                  <p className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </p>
                </div>
                <GanttTaskList groups={groups} />
              </ResizablePanel>

              <ResizableHandle
                withHandle
                className={isMobile ? "my-1" : "mx-1 self-stretch"}
              />

              <ResizablePanel
                defaultSize={isMobile ? 60 : 75}
                className={isMobile ? "pt-3" : "overflow-hidden pl-3"}
              >
                <div
                  className="neo-inset z-10 rounded-[20px] border border-white/50 px-4"
                  style={{
                    height: GANTT_HEADER_HEIGHT,
                    position: isExporting ? "relative" : "sticky",
                    top: isExporting ? undefined : 0,
                  }}
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
                  onTaskUpdate={(taskId, startDate, endDate) => {
                    if (usingDemoData) {
                      setDemoTasks((current) =>
                        current.map((task) =>
                          task.id === taskId
                            ? {
                                ...task,
                                startDate,
                                endDate,
                                originalStartDate: startDate,
                                originalEndDate: endDate,
                              }
                            : task,
                        ),
                      );
                      return;
                    }

                    updateTaskMutation.mutate({ taskId, startDate, endDate });
                  }}
                  onTaskOrderChange={(task, newIndex) => {
                    setTaskOrder((current) =>
                      moveTaskWithinEpic(activeTasks, current, task.id, task.epicId, newIndex),
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
