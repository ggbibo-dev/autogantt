import { useRef } from "react";
import type { JiraTask } from "@/types/jira";
import {
  GANTT_GROUP_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
} from "@/components/gantt/constants";
import { GanttGroupHeader } from "@/components/gantt/GanttGroupHeader";
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
  onTaskEdit: (task: JiraTask) => void;
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
  onTaskEdit,
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
          <div
            className="absolute inset-x-0 top-0 flex items-center"
            style={{ height: GANTT_GROUP_HEADER_HEIGHT }}
          >
            <GanttGroupHeader title={group.epic.name} variant="canvas" />
          </div>
          {group.tasks.map((task, index) => (
            <TaskBar
              key={task.id}
              task={task}
              index={index}
              offsetY={GANTT_GROUP_HEADER_HEIGHT}
              startDate={startDate}
              endDate={endDate}
              onUpdate={(nextStart, nextEnd) =>
                onTaskUpdate(task.id, nextStart, nextEnd)
              }
              onOrderChange={(newIndex) => onTaskOrderChange(task, newIndex)}
              onEdit={() => onTaskEdit(task)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
