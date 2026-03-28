import { PointerEvent, useEffect, useRef, useState } from "react";
import { addDays, addSeconds, differenceInSeconds, format } from "date-fns";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  GANTT_BAR_HEIGHT,
  GANTT_ROW_HEIGHT,
  GANTT_SECONDS_IN_DAY,
} from "@/components/gantt/constants";
import { cn } from "@/lib/utils";
import type { JiraTask } from "@/types/jira";

interface TaskBarProps {
  task: JiraTask;
  startDate: Date;
  endDate: Date;
  index: number;
  offsetY?: number;
  onUpdate: (startDate: Date, endDate: Date) => void;
  onOrderChange?: (newIndex: number) => void;
}

const TASK_STATUS_STYLES: Record<string, string> = {
  DONE:
    "border-emerald-200/80 bg-[linear-gradient(145deg,rgba(237,255,247,0.95),rgba(203,240,221,0.88))] text-emerald-950",
  "IN PROGRESS":
    "border-sky-200/80 bg-[linear-gradient(145deg,rgba(241,248,255,0.95),rgba(205,226,248,0.88))] text-sky-950",
  BLOCKED:
    "border-rose-200/80 bg-[linear-gradient(145deg,rgba(255,245,246,0.95),rgba(247,210,219,0.88))] text-rose-950",
};

function normalizeTaskDate(value: Date | string, hour: number) {
  const date = new Date(value);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function getPercentOffset(value: Date, rangeStart: Date, rangeEnd: Date) {
  const totalDuration = Math.max(1, differenceInSeconds(rangeEnd, rangeStart));
  const secondsFromStart = differenceInSeconds(value, rangeStart);

  return (secondsFromStart / totalDuration) * 100;
}

export function TaskBar({
  task,
  startDate,
  endDate,
  index,
  offsetY = 0,
  onUpdate,
  onOrderChange,
}: TaskBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [start, setTaskStart] = useState(() => normalizeTaskDate(task.startDate, 0));
  const [end, setTaskEnd] = useState(() => normalizeTaskDate(task.endDate, 12));
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef(start);
  const endRef = useRef(end);

  const totalDuration = Math.max(1, differenceInSeconds(endDate, startDate));
  const rawLeft = getPercentOffset(start, startDate, endDate);
  const rawRight = getPercentOffset(end, startDate, endDate);
  const left = `${Math.max(0, Math.min(100, rawLeft))}%`;
  const barWidth = `${Math.max(0, Math.min(100, rawRight) - Math.max(0, rawLeft))}%`;
  const statusClass =
    TASK_STATUS_STYLES[task.status.toUpperCase()] ??
    "border-slate-200/80 bg-[linear-gradient(145deg,rgba(247,249,255,0.96),rgba(220,228,241,0.9))] text-slate-800";

  useEffect(() => {
    const taskStart = normalizeTaskDate(task.startDate, 0);
    const taskEnd = normalizeTaskDate(task.endDate, 12);
    setTaskStart(taskStart);
    setTaskEnd(taskEnd);
    startRef.current = taskStart;
    endRef.current = taskEnd;
  }, [task.endDate, task.startDate]);

  function handleResizeStart(
    event: PointerEvent<HTMLDivElement>,
    direction: "left" | "right",
  ) {
    event.stopPropagation();
    const initialX = event.clientX;
    const initialStart = start;
    const initialEnd = end;

    setIsResizing(true);

    function onMouseMove(nextEvent: MouseEvent) {
      const deltaX = nextEvent.clientX - initialX;
      const timelineWidth = barRef.current?.parentElement?.offsetWidth || 1;
      const dayWidth = timelineWidth / (totalDuration / GANTT_SECONDS_IN_DAY);
      const daysDragged = deltaX / dayWidth;

      if (direction === "left") {
        const newStart = addSeconds(
          initialStart,
          daysDragged * GANTT_SECONDS_IN_DAY,
        );
        if (newStart < initialEnd) {
          setTaskStart(newStart);
          startRef.current = newStart;
        }
        return;
      }

      const newEnd = addSeconds(
        initialEnd,
        daysDragged * GANTT_SECONDS_IN_DAY,
      );
      if (newEnd > initialStart) {
        setTaskEnd(newEnd);
        endRef.current = newEnd;
      }
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);

      if (direction === "left") {
        onUpdate(startRef.current, initialEnd);
        return;
      }

      onUpdate(initialStart, endRef.current);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  return (
    <motion.div
      ref={barRef}
      initial={false}
      drag={!isResizing}
      dragDirectionLock
      dragConstraints={{ left: 0 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={0.06}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 16px 28px rgba(120, 139, 166, 0.18)",
        cursor: isResizing ? "ew-resize" : "grabbing",
      }}
      onDragStart={() => {
        if (!isResizing) {
          setIsDragging(true);
        }
      }}
      onDragEnd={(_event, info) => {
        if (isResizing) {
          return;
        }

        setIsDragging(false);

        if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
          const timelineWidth = barRef.current?.parentElement?.offsetWidth || 1;
          const dayWidth = timelineWidth / (totalDuration / GANTT_SECONDS_IN_DAY);
          const daysDragged = Math.round(info.offset.x / dayWidth);

          if (!daysDragged) {
            return;
          }

          const nextStart = addDays(startRef.current, daysDragged);
          const nextEnd = addDays(endRef.current, daysDragged);

          setTaskStart(nextStart);
          setTaskEnd(nextEnd);
          startRef.current = nextStart;
          endRef.current = nextEnd;
          onUpdate(nextStart, nextEnd);
          return;
        }

        if (Math.abs(info.offset.y) <= 10) {
          return;
        }

        const container = barRef.current?.parentElement;
        const element = barRef.current;
        if (!container || !element) {
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeY = elementRect.top - containerRect.top;
        const nextIndex = Math.max(0, Math.round(relativeY / GANTT_ROW_HEIGHT));

        if (nextIndex !== index) {
          onOrderChange?.(nextIndex);
        }
      }}
      className="absolute cursor-grab"
      style={{
        width: barWidth,
        top: 0,
        zIndex: isDragging ? 50 : 1,
        height: GANTT_BAR_HEIGHT,
        willChange: "transform, left",
      }}
      animate={{
        left,
        y: offsetY + index * GANTT_ROW_HEIGHT,
      }}
      transition={{
        y: {
          type: "spring",
          damping: 30,
          stiffness: 400,
          mass: 0.8,
        },
        left: {
          type: "spring",
          damping: 34,
          stiffness: 480,
          mass: 0.7,
        },
      }}
    >
      <div className="relative flex h-full w-full items-center">
        <span className="absolute right-full whitespace-nowrap pr-3 text-xs font-medium text-muted-foreground">
          {format(start, "MMM d")} - {format(end, "MMM d")}
        </span>
        <div
          className="absolute left-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(event) => handleResizeStart(event, "left")}
        />
        <div
          className="absolute right-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(event) => handleResizeStart(event, "right")}
        />
        <Card
          className={cn(
            "h-full w-full border shadow-[10px_10px_18px_rgba(163,177,198,0.2),-10px_-10px_18px_rgba(255,255,255,0.88)] transition-shadow hover:ring-2 hover:ring-primary/15 hover:ring-offset-1 active:cursor-grabbing",
            statusClass,
            isDragging && "ring-2 ring-primary/30 ring-offset-2 shadow-lg",
          )}
        >
          <div className="flex h-full items-center justify-between gap-3 px-6 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-5">{task.name}</p>
              <p className="mt-1.5 truncate text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {task.status}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
