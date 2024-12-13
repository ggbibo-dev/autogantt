import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, differenceInDays } from "date-fns";
import html2canvas from "html2canvas";
import type { JiraTask } from "@/types/jira";
import type { Epic, Task } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TaskBar } from "./TaskBar";
import { Timeline } from "./Timeline";
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

export function GanttChart() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: addDays(new Date(), 30),
  });
  const [zoom, setZoom] = useState<number>(1);
  const [baseDuration] = useState<number>(
    differenceInDays(dateRange.end, dateRange.start),
  );
  const [taskOrder, setTaskOrder] = useState<Record<number, number>>({});
  const [customProjectEndDate, setCustomProjectEndDate] = useState<
    Date | undefined
  >();

  const queryClient = useQueryClient();

  const { data: epics, isLoading: epicsLoading } = useQuery<Epic[]>({
    queryKey: ["epics"],
    queryFn: () => fetchJiraEpics(),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<(Task & Partial<JiraTask>)[]>({
    queryKey: ["tasks"],
    queryFn: () => fetchJiraTasks(),
  });

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const initialOrder: Record<number, number> = {};
      const tasksByEpic: Record<number, (Task & Partial<JiraTask>)[]> = {};
      tasks.forEach((task) => {
        const epicId = task.epicId || 0;
        if (!tasksByEpic[epicId]) {
          tasksByEpic[epicId] = [];
        }
        tasksByEpic[epicId].push({
          ...task,
          jiraId: task.jiraId || '',
          metadata: task.metadata || {},
        });
      });

      Object.values(tasksByEpic).forEach((epicTasks) => {
        epicTasks.forEach((task, index) => {
          initialOrder[task.id] = index;
        });
      });

      setTaskOrder(initialOrder);
    }
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

  const handleExport = async (): Promise<void> => {
    const panelGroup = document.querySelector(
      '[data-panel-id=":r3:"]',
    ) as HTMLElement | null;

    if (!panelGroup) {
      console.error("Could not find the chart panel group");
      return;
    }

    // Store original styles
    const originalStyles = {
      height: panelGroup.style.height,
      overflow: panelGroup.style.overflow,
      padding: panelGroup.style.padding,
      width: panelGroup.style.width,
    };

    // Store task description elements
    const taskDescriptions = panelGroup.querySelectorAll('.text-muted-foreground');

    try {
      // Apply export styles
      panelGroup.style.height = 'auto';
      panelGroup.style.overflow = 'visible';
      panelGroup.style.padding = '10px';
      panelGroup.style.width = 'auto';

      // Remove truncation from all task descriptions
      taskDescriptions.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.whiteSpace = 'normal';
          el.style.overflow = 'visible';
          el.style.width = 'auto';
        }
      });

      const canvas = await html2canvas(panelGroup, {
        scale: 2,
        useCORS: true,
        width: panelGroup.scrollWidth,
        height: panelGroup.scrollHeight,
        windowHeight: panelGroup.scrollHeight,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true,
      });

      // Create and trigger download
      const link = document.createElement("a");
      link.download = `gantt-chart-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      // Restore original styles
      panelGroup.style.height = originalStyles.height;
      panelGroup.style.overflow = originalStyles.overflow;
      panelGroup.style.padding = originalStyles.padding;
      panelGroup.style.width = originalStyles.width;

      // Restore truncation styles
      taskDescriptions.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.whiteSpace = '';
          el.style.overflow = '';
          el.style.width = '';
        }
      });
    }
  };

  if (epicsLoading || tasksLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-4 w-full">
      <div className="flex justify-between mb-4 sticky top-0 bg-background z-10">
        <div className="flex gap-2">
          <Button
            onClick={() =>
              setDateRange({
                start: subDays(dateRange.start, 7),
                end: subDays(dateRange.end, 7),
              })
            }
          >
            ←
          </Button>
          <Button
            onClick={() =>
              setDateRange({
                start: addDays(dateRange.start, 7),
                end: addDays(dateRange.end, 7),
              })
            }
          >
            →
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={[zoom]}
            onValueChange={(value: number[]) => {
              const currZoom = value[0];
              setZoom(currZoom);

              // Calculate the center date of the current view
              const centerDate = new Date(
                dateRange.start.getTime() +
                  (dateRange.end.getTime() - dateRange.start.getTime()) / 2,
              );

              // Adjust the duration based on zoom level
              const adjustedDuration = Math.max(7, Math.floor(baseDuration / currZoom));
              const halfAdjustedDuration = Math.floor(adjustedDuration / 2);

              // Calculate new date range
              const newStart = subDays(centerDate, halfAdjustedDuration);
              const newEnd = addDays(centerDate, halfAdjustedDuration);

              setDateRange({
                start: newStart,
                end: newEnd,
              });
            }}
            min={0}
            max={2}
            step={0.1}
            className="w-32"
          />
          <Button variant="outline" onClick={handleExport}>
            Export Chart
          </Button>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] h-[calc(100vh-200px)] rounded-lg border"
      >
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={50}
          className="p-3 h-full overflow-y-auto"
        >
          <div className="h-8" /> {/* Space for timeline */}
          <div className="mt-8 min-h-full">
            {(epics || []).map((epic: Epic) => {
              const epicTasks =
                tasks?.filter((t) => t.epicId === epic.id) || [];
              return (
                <div key={epic.id} className="mb-6">
                  <h3 className="font-medium mb-2">{epic.name}</h3>
                  <div
                    className="relative"
                    style={{ minHeight: epicTasks.length * 48 }}
                  >
                    {epicTasks
                      .sort(
                        (a, b) =>
                          (taskOrder[a.id] || 0) - (taskOrder[b.id] || 0),
                      )
                      .map((task, index) => (
                        <div
                          key={task.id}
                          className="absolute h-12 w-full flex items-center"
                          style={{
                            top: `${index * 48}px`,
                          }}
                        >
                          <div className="text-sm text-muted-foreground whitespace-normal">
                            {task.description || task.name}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} className="p-3 h-full">
          <div className="relative overflow-auto w-full h-full gantt-chart-content">
            <div
              style={{
                width: "100%",
                minHeight:
                  tasks && epics
                    ? Math.max(
                        600,
                        epics.reduce((totalHeight: number, epic: Epic) => {
                          const epicTasks = tasks.filter(
                            (t) => t.epicId === epic.id,
                          ).length;
                          return totalHeight + epicTasks * 48 + 64;
                        }, 48),
                      )
                    : 600,
                position: "relative",
              }}
            >
              <div className="absolute inset-0 overflow-x-visible">
                <div
                  style={{
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div className="h-8">
                    <Timeline
                      startDate={dateRange.start}
                      endDate={dateRange.end}
                      zoom={zoom}
                      today={new Date()}
                      projectEndDate={
                        customProjectEndDate ||
                        tasks?.reduce((latest: Date | undefined, task) => {
                          const taskEnd = new Date(task.endDate);
                          return latest && latest > taskEnd ? latest : taskEnd;
                        }, undefined)
                      }
                      onProjectEndDateChange={setCustomProjectEndDate}
                    />
                  </div>

                  <div
                    className="mt-8"
                    style={{
                      width: `${100 * zoom}%`,
                      minWidth: "100%",
                      position: "relative",
                      overflowX: "visible"
                    }}
                  >
                    {(epics || []).map((epic) => (
                      <div key={epic.id} className="mb-6">
                        <h3 className="font-medium h-8 mb-2 invisible">
                          Spacer
                        </h3>
                        <div
                          className="relative"
                          style={{
                            minHeight:
                              (tasks?.filter((t) => t.epicId === epic.id)
                                ?.length || 0) * 48,
                          }}
                        >
                          {tasks
                            ?.filter((task) => task.epicId === epic.id)
                            .sort(
                              (a, b) =>
                                (taskOrder[a.id] || 0) - (taskOrder[b.id] || 0),
                            )
                            .map((task, index) => (
                              <TaskBar
                                key={task.id}
                                task={task}
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                zoom={zoom}
                                index={index}
                                onUpdate={(newStart, newEnd) =>
                                  updateTaskMutation.mutate({
                                    taskId: task.id,
                                    startDate: newStart,
                                    endDate: newEnd,
                                  })
                                }
                                onOrderChange={(newIndex) => {
                                  if (!tasks) return;

                                  const sortedTasks = [...tasks]
                                    .filter((t) => t.epicId === task.epicId)
                                    .sort(
                                      (a, b) =>
                                        (taskOrder[a.id] || 0) -
                                        (taskOrder[b.id] || 0),
                                    );

                                  const currentIndex = sortedTasks.findIndex(
                                    (t) => t.id === task.id,
                                  );
                                  const maxIndex = sortedTasks.length - 1;
                                  const boundedNewIndex = Math.max(
                                    0,
                                    Math.min(newIndex, maxIndex),
                                  );

                                  if (
                                    currentIndex === -1 ||
                                    currentIndex === boundedNewIndex
                                  )
                                    return;

                                  const updatedTasks = [...sortedTasks];
                                  const [movedTask] = updatedTasks.splice(
                                    currentIndex,
                                    1,
                                  );
                                  updatedTasks.splice(
                                    boundedNewIndex,
                                    0,
                                    movedTask,
                                  );

                                  const newOrder = { ...taskOrder };

                                  updatedTasks.forEach((t, idx) => {
                                    newOrder[t.id] = idx;
                                  });

                                  setTaskOrder(newOrder);
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Card>
  );
}
