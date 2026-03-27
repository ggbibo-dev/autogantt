import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded]);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) {
      return;
    }

    const updateOverflow = () => {
      setCanExpand(element.scrollWidth > element.clientWidth + 1);
    };

    updateOverflow();

    const observer = new ResizeObserver(() => updateOverflow());
    observer.observe(element);

    return () => observer.disconnect();
  }, [description]);

  return (
    <div
      className="absolute inset-x-0 flex items-center px-1"
      style={{ top, height }}
    >
      <div
        ref={containerRef}
        className="relative grid h-full min-w-0 flex-1 grid-cols-[minmax(0,1fr)_7.5rem] items-stretch gap-x-5 rounded-[18px] border border-white/45 bg-transparent px-4"
      >
        <div className="flex min-w-0 max-w-[34rem] flex-col justify-center gap-2 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {task.name}
          </p>
          <div className="flex items-center gap-2">
            <p
              ref={descriptionRef}
              className="min-w-0 flex-1 truncate text-xs leading-5 text-muted-foreground"
            >
              {description}
            </p>
            {canExpand ? (
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:bg-white/35"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? "Less" : "More"}
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            ) : null}
          </div>
          {isExpanded ? (
            <div
              id={panelId}
              className="absolute left-4 right-[8.75rem] top-[calc(100%-0.5rem)] z-30 rounded-[18px] border border-white/65 bg-[linear-gradient(145deg,rgba(247,249,253,0.98),rgba(232,238,247,0.96))] p-4 text-sm leading-6 text-slate-600 shadow-[0_14px_28px_rgba(163,177,198,0.18)]"
            >
              {description}
            </div>
          ) : null}
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
