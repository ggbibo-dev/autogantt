import type { ReactNode } from "react";
import { format } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import type { JiraTask } from "@/types/jira";

interface GanttTaskDetailCardProps {
  children: ReactNode;
  task: JiraTask;
}

function TaskDetailBody({ task }: { task: JiraTask }) {
  const description = task.description?.trim() || "No description provided.";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Task
          </p>
          <p className="text-sm font-semibold leading-6 text-foreground">
            {task.name}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-[inset_1px_1px_2px_rgba(255,255,255,0.92),inset_-2px_-2px_6px_rgba(177,191,211,0.18)]">
          {task.status}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Description
        </p>
        <p className="text-sm leading-6 text-foreground/85">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-white/55 bg-white/55 px-3 py-3 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.88),inset_-4px_-4px_10px_rgba(177,191,211,0.14)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Start
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {format(new Date(task.startDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="rounded-[18px] border border-white/55 bg-white/55 px-3 py-3 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.88),inset_-4px_-4px_10px_rgba(177,191,211,0.14)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            End
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {format(new Date(task.endDate), "MMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function GanttTaskDetailCard({
  children,
  task,
}: GanttTaskDetailCardProps) {
  const isMobile = useIsMobile();
  const contentClassName =
    "neo-surface z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-[24px] border-white/60 bg-[linear-gradient(160deg,rgba(252,252,255,0.97),rgba(235,240,248,0.94))] p-4 shadow-[18px_18px_36px_rgba(173,184,201,0.24),-14px_-14px_30px_rgba(255,255,255,0.88)]";

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          side="bottom"
          sideOffset={10}
          className={contentClassName}
        >
          <TaskDetailBody task={task} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard openDelay={120} closeDelay={90}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        collisionPadding={16}
        side="right"
        sideOffset={12}
        className={contentClassName}
      >
        <TaskDetailBody task={task} />
      </HoverCardContent>
    </HoverCard>
  );
}
