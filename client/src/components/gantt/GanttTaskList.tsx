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
          className="relative mb-4 rounded-[24px] p-3 last:mb-0"
          style={{ minHeight: getGroupHeight(group.tasks.length) }}
        >
          {group.tasks.map((task, index) => (
            <div
              key={task.id}
              className="absolute inset-x-0 flex items-center px-1"
              style={{
                top: index * GANTT_ROW_HEIGHT,
                height: GANTT_ROW_HEIGHT,
              }}
            >
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-x-5 rounded-[18px] border border-white/45 bg-transparent px-4 py-4">
                <div className="min-w-0 max-w-[34rem]">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {task.name}
                  </p>
                  <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
                    {task.description || task.status}
                  </p>
                </div>
                <span className="justify-self-end text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
