import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import type { JiraTask } from "@/types/jira";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TaskBar } from "./TaskBar";
import { Timeline } from "./Timeline";
import { fetchJiraEpics, fetchJiraTasks, updateTaskDates } from "@/lib/jira-api";

export function GanttChart() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: addDays(new Date(), 30),
  });
  const [zoom, setZoom] = useState(1);

  const queryClient = useQueryClient();

  const { data: epics, isLoading: epicsLoading } = useQuery({
    queryKey: ["epics"],
    queryFn: () => fetchJiraEpics(),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<JiraTask[]>({
    queryKey: ["tasks"],
    queryFn: () => fetchJiraTasks(),
  });

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
    <Card className="p-4">
      <div className="flex justify-between mb-4">
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
        <Slider
          value={[zoom]}
          onValueChange={(value) => setZoom(value[0])}
          min={0.5}
          max={2}
          step={0.1}
          className="w-32"
        />
      </div>

      <div className="relative overflow-x-auto" style={{ width: `${100 * zoom}%` }}>
        <Timeline
          startDate={dateRange.start}
          endDate={dateRange.end}
          zoom={zoom}
        />
        
        <div className="mt-8">
          {epics?.map((epic: { id: number; name: string }) => (
            <div key={epic.id} className="mb-6">
              <h3 className="font-medium mb-2">{epic.name}</h3>
              {tasks
                ?.filter((task: any) => task.epicId === epic.id)
                .map((task: any) => (
                  <TaskBar
                    key={task.id}
                    task={task}
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    zoom={zoom}
                    onUpdate={(newStart, newEnd) =>
                      updateTaskMutation.mutate({
                        taskId: task.id,
                        startDate: newStart,
                        endDate: newEnd,
                      })
                    }
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
