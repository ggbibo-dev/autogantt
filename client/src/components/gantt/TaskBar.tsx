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
  onUpdate: (startDate: Date, endDate: Date) => void;
  onOrderChange?: (newIndex: number) => void;
}

const TASK_STATUS_STYLES: Record<string, string> = {
  DONE: "bg-green-100 hover:bg-green-100/90",
  "IN PROGRESS": "bg-blue-100 hover:bg-blue-100/90",
  BLOCKED: "bg-red-100 hover:bg-red-100/90",
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
    "bg-slate-200 hover:bg-slate-200/90";

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
      drag={!isResizing}
      dragDirectionLock
      dragConstraints={{ left: 0 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={{ right: 0 }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
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
        left,
        width: barWidth,
        top: 0,
        zIndex: isDragging ? 50 : 1,
        height: GANTT_BAR_HEIGHT,
      }}
      animate={{ y: index * GANTT_ROW_HEIGHT }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400,
        mass: 0.8,
      }}
    >
      <div className="relative flex h-full w-full items-center">
        <span className="absolute right-full whitespace-nowrap pr-2 text-xs text-muted-foreground">
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
            "h-full w-full transition-shadow hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 active:cursor-grabbing",
            statusClass,
            isDragging && "ring-2 ring-primary/30 ring-offset-2 shadow-lg",
          )}
        />
      </div>
    </motion.div>
  );
}
