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
          className="relative mb-4 rounded-[24px] bg-white/20 p-3 last:mb-0"
          style={{ minHeight: getGroupHeight(group.tasks.length) }}
        >
          <div className="absolute right-4 top-3 neo-badge">
            {group.epic.name}
          </div>
          {group.tasks.map((task, index) => (
            <div
              key={task.id}
              className="absolute inset-x-0 flex items-center px-1"
              style={{
                top: index * GANTT_ROW_HEIGHT,
                height: GANTT_ROW_HEIGHT,
              }}
            >
              <div className="neo-inset flex min-w-0 flex-1 items-center justify-between rounded-[18px] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {task.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.description || task.status}
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
