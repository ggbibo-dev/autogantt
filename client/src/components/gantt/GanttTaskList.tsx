import { GANTT_ROW_HEIGHT } from "@/components/gantt/constants";
import { getGroupHeight, type GanttGroup } from "@/components/gantt/utils";

interface GanttTaskListProps {
  groups: GanttGroup[];
}

export function GanttTaskList({ groups }: GanttTaskListProps) {
  return (
    <div className="relative">
      {groups.map((group) => (
        <div
          key={group.epic.id}
          className="relative border-b border-dashed border-border/60 last:border-b-0"
          style={{ minHeight: getGroupHeight(group.tasks.length) }}
        >
          {group.tasks.map((task, index) => (
            <div
              key={task.id}
              className="absolute inset-x-0 flex items-center border-b border-border/40 pr-3 last:border-b-0"
              style={{
                top: index * GANTT_ROW_HEIGHT,
                height: GANTT_ROW_HEIGHT,
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {task.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.description || task.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
