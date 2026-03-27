import type { JiraTask } from "@/types/jira";

interface GanttTaskListItemProps {
  task: JiraTask;
  top: number;
  height: number;
}

export function GanttTaskListItem({
  task,
  top,
  height,
}: GanttTaskListItemProps) {
  const description = task.description || task.status;

  return (
    <div
      className="absolute inset-x-0 flex items-center px-1"
      style={{ top, height }}
    >
      <div
        className="grid h-full min-w-0 flex-1 grid-cols-[minmax(0,1fr)_7.5rem] items-stretch gap-x-5 rounded-[18px] border border-white/45 bg-transparent px-4"
      >
        <div className="flex min-w-0 max-w-[34rem] flex-col justify-center gap-2 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {task.name}
          </p>
          <p className="truncate text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex h-full items-center justify-end py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {task.status}
          </span>
        </div>
      </div>
    </div>
  );
}
