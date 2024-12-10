import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import html2canvas from "html2canvas";
import type { JiraTask } from "@/types/jira";
import type { Epic, Task } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TaskBar } from "./TaskBar";
import { Timeline } from "./Timeline";
import { fetchJiraEpics, fetchJiraTasks, updateTaskDates } from "@/lib/jira-api";
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
  const [zoom, setZoom] = useState(1);
  const [taskOrder, setTaskOrder] = useState<Record<number, number>>({});
  const [customProjectEndDate, setCustomProjectEndDate] = useState<Date | undefined>();

  const queryClient = useQueryClient();

  const { data: epics, isLoading: epicsLoading } = useQuery<Epic[]>({
    queryKey: ["epics"],
    queryFn: () => fetchJiraEpics(),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => fetchJiraTasks(),
  });

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const initialOrder: Record<number, number> = {};
      const tasksByEpic: Record<number, Task[]> = {};
      tasks.forEach(task => {
        const epicId = task.epicId || 0;
        if (!tasksByEpic[epicId]) {
          tasksByEpic[epicId] = [];
        }
        tasksByEpic[epicId].push({
          ...task,
          jiraId: '', // Default empty string for non-JIRA tasks
          metadata: {}, // Default empty object for non-JIRA tasks
        } as Task & { jiraId: string; metadata: any });
      });
      
      Object.values(tasksByEpic).forEach(epicTasks => {
        epicTasks.forEach((task, index) => {
          initialOrder[task.id] = index;
        });
      });
      
      setTaskOrder(initialOrder);
    }
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: number, startDate: Date, endDate: Date }) =>
      updateTaskDates(data.taskId, data.startDate, data.endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

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
            onValueChange={(value) => setZoom(value[0])}
            min={0.5}
            max={2}
            step={0.1}
            className="w-32"
          />
          <Button
            variant="outline"
            onClick={async () => {
              // Find the earliest start date and latest end date
              const allTasks = tasks || [];
              const startDates = allTasks.map(task => new Date(task.startDate).getTime());
              const endDates = allTasks.map(task => new Date(task.endDate).getTime());
              const earliestStart = new Date(Math.min(...startDates));
              const latestEnd = new Date(Math.max(...endDates));
              
              // Set the date range to include all tasks
              setDateRange({
                start: earliestStart,
                end: latestEnd
              });

              // Wait for state update to complete
              await new Promise(resolve => setTimeout(resolve, 100));

              const panelGroup = document.querySelector('.min-h-\\[600px\\]');
              if (!panelGroup) {
                console.error('Could not find the chart panel group');
                return;
              }

              try {
                const canvas = await html2canvas(panelGroup as HTMLElement, {
                  scale: 2, // Higher resolution
                  useCORS: true,
                  backgroundColor: '#ffffff',
                  scrollX: -window.scrollX,
                  scrollY: -window.scrollY,
                  windowWidth: panelGroup.scrollWidth,
                  windowHeight: panelGroup.scrollHeight,
                  logging: true,
                  allowTaint: true,
                  foreignObjectRendering: true
                });
                
                // Create download link
                const link = document.createElement('a');
                link.download = `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              } catch (error) {
                console.error('Failed to export chart:', error);
              }
            }}
          >
            Export Chart
          </Button>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] h-[calc(100vh-200px)] rounded-lg border"
      >
        <ResizablePanel defaultSize={25} minSize={15} maxSize={50} className="p-3 h-full overflow-y-auto">
          <div className="h-8" /> {/* Space for timeline */}
          <div className="mt-8 min-h-full">
            {(epics || []).map((epic: Epic) => {
              const epicTasks = tasks?.filter(t => t.epicId === epic.id) || [];
              return (
                <div key={epic.id} className="mb-6">
                  <h3 className="font-medium mb-2">{epic.name}</h3>
                  <div className="relative" style={{ minHeight: epicTasks.length * 48 }}>
                    {epicTasks
                      .sort((a, b) => (taskOrder[a.id] || 0) - (taskOrder[b.id] || 0))
                      .map((task, index) => (
                        <div
                          key={task.id}
                          className="absolute h-12 w-full flex items-center"
                          style={{ 
                            top: `${index * 48}px`
                          }}
                        >
                          <div className="truncate text-sm text-muted-foreground">
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

        {/* Scrollable timeline section */}
        <ResizablePanel defaultSize={75} className="p-3 h-full">
          <div className="relative overflow-auto w-full h-full gantt-chart-content">
            <div 
              style={{ 
                width: '100%',
                minHeight: tasks && epics ? Math.max(
                  600,
                  epics.reduce((totalHeight: number, epic: Epic) => {
                    const epicTasks = tasks.filter(t => t.epicId === epic.id).length;
                    // Account for epic header (24px) + margin (16px) + tasks height
                    return totalHeight + (epicTasks * 48) + 64; 
                  }, 48) // Start with initial padding
                ) : 600,
                position: 'relative'
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  width: `${100 * zoom}%`,
                  transform: `translateX(${(1 - zoom) * 50}%)`,
                  transformOrigin: 'center'
                }}
              >
          <div className="h-8">
            <Timeline
              startDate={dateRange.start}
              endDate={dateRange.end}
              zoom={zoom}
              today={new Date()}
              projectEndDate={customProjectEndDate || tasks?.reduce((latest: Date | undefined, task) => {
                const taskEnd = new Date(task.endDate);
                return latest && latest > taskEnd ? latest : taskEnd;
              }, undefined)}
              onProjectEndDateChange={setCustomProjectEndDate}
            />
          </div>
          
          <div className="mt-8">
            {(epics || []).map((epic) => (
              <div key={epic.id} className="mb-6">
                <h3 className="font-medium h-8 mb-2 invisible">Spacer</h3>
                <div className="relative" style={{ minHeight: (tasks?.filter(t => t.epicId === epic.id)?.length || 0) * 48 }}>
                  {tasks
                    ?.filter((task) => task.epicId === epic.id)
                    .sort((a, b) => (taskOrder[a.id] || 0) - (taskOrder[b.id] || 0))
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
                            .filter(t => t.epicId === task.epicId)
                            .sort((a, b) => (taskOrder[a.id] || 0) - (taskOrder[b.id] || 0));
                          
                          const currentIndex = sortedTasks.findIndex(t => t.id === task.id);
                          const maxIndex = sortedTasks.length - 1;
                          const boundedNewIndex = Math.max(0, Math.min(newIndex, maxIndex));
                          
                          if (currentIndex === -1 || currentIndex === boundedNewIndex) return;
                          
                          const updatedTasks = [...sortedTasks];
                          const [movedTask] = updatedTasks.splice(currentIndex, 1);
                          updatedTasks.splice(boundedNewIndex, 0, movedTask);
                          
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </Card>
  );
}
