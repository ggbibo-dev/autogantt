import { useRef } from "react";
import type { JiraTask } from "@/types/jira";
import { TargetLines } from "@/components/gantt/Targetlines";
import { TaskBar } from "@/components/gantt/TaskBar";
import { getGroupHeight, type GanttGroup } from "@/components/gantt/utils";

interface GanttTaskCanvasProps {
  groups: GanttGroup[];
  chartHeight: number;
  startDate: Date;
  endDate: Date;
  projectEndDate?: Date;
  onProjectEndDateChange: (newDate: Date) => void;
  onTaskUpdate: (taskId: number, startDate: Date, endDate: Date) => void;
  onTaskOrderChange: (task: JiraTask, newIndex: number) => void;
}

export function GanttTaskCanvas({
  groups,
  chartHeight,
  startDate,
  endDate,
  projectEndDate,
  onProjectEndDateChange,
  onTaskUpdate,
  onTaskOrderChange,
}: GanttTaskCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[var(--gantt-chart-min-height)]"
      style={{ height: chartHeight }}
    >
      <TargetLines
        containerRef={containerRef}
        start={startDate}
        end={endDate}
        today={new Date()}
        projectEndDate={projectEndDate}
        onProjectEndDateChange={onProjectEndDateChange}
      />

      {groups.map((group) => (
        <div
          key={group.epic.id}
          className="relative mb-4 rounded-[24px] bg-white/15 p-3 last:mb-0"
          style={{ minHeight: getGroupHeight(group.tasks.length) }}
        >
          {group.tasks.map((task, index) => (
            <TaskBar
              key={task.id}
              task={task}
              index={index}
              startDate={startDate}
              endDate={endDate}
              onUpdate={(nextStart, nextEnd) =>
                onTaskUpdate(task.id, nextStart, nextEnd)
              }
              onOrderChange={(newIndex) => onTaskOrderChange(task, newIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
