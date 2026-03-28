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
  return (
    <div
      className="absolute inset-x-0 flex items-center px-1"
      style={{ top, height }}
    >
      <button
        type="button"
        className="grid h-full min-w-0 flex-1 grid-cols-[minmax(0,1fr)_4.75rem] items-stretch gap-x-3 rounded-[18px] border border-white/45 bg-transparent px-4 text-left transition-[border-color,background-color,transform] duration-150 hover:border-white/70 hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:gap-x-5"
      >
        <div className="flex min-w-0 items-center py-3">
          <p className="truncate text-sm font-semibold leading-5 text-foreground">
            {task.name}
          </p>
        </div>
        <div className="flex h-full items-center justify-end py-3">
          <span className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
            {task.status}
          </span>
        </div>
      </button>
    </div>
  );
}
