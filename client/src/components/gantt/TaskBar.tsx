import { PointerEvent, useEffect, useRef, useState } from "react";
import { addDays, addSeconds, differenceInSeconds, format } from "date-fns";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  GANTT_BAR_HEIGHT,
  GANTT_ROW_HEIGHT,
  GANTT_SECONDS_IN_DAY,
} from "@/components/gantt/constants";
import { useIsMobile } from "@/hooks/use-mobile";
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
  onEdit?: () => void;
}

const TASK_STATUS_STYLES: Record<string, string> = {
  DONE:
    "border-emerald-200/80 bg-[linear-gradient(145deg,rgba(237,255,247,0.95),rgba(203,240,221,0.88))] text-emerald-950",
  "IN PROGRESS":
    "border-sky-200/80 bg-[linear-gradient(145deg,rgba(241,248,255,0.95),rgba(205,226,248,0.88))] text-sky-950",
  BLOCKED:
    "border-rose-200/80 bg-[linear-gradient(145deg,rgba(255,245,246,0.95),rgba(247,210,219,0.88))] text-rose-950",
};
const GESTURE_LOCK_PX = 12;
const TOUCH_LONG_PRESS_MS = 180;
const MOVE_AXIS_RATIO = 1.35;
const REORDER_AXIS_RATIO = 1.35;
const MOVE_DOMINANCE_PX = 10;
const REORDER_DOMINANCE_PX = 10;

type GestureMode =
  | "idle"
  | "press"
  | "move"
  | "reorder"
  | "resize-left"
  | "resize-right";

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

function detectGestureIntent(
  deltaX: number,
  deltaY: number,
): Extract<GestureMode, "move" | "reorder"> | null {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) < GESTURE_LOCK_PX) {
    return null;
  }

  if (absX >= absY * MOVE_AXIS_RATIO && absX - absY >= MOVE_DOMINANCE_PX) {
    return "move";
  }

  if (absY >= absX * REORDER_AXIS_RATIO && absY - absX >= REORDER_DOMINANCE_PX) {
    return "reorder";
  }

  return null;
}

export function TaskBar({
  task,
  startDate,
  endDate,
  index,
  offsetY = 0,
  onUpdate,
  onOrderChange,
  onEdit,
}: TaskBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [start, setTaskStart] = useState(() => normalizeTaskDate(task.startDate, 0));
  const [end, setTaskEnd] = useState(() => normalizeTaskDate(task.endDate, 12));
  const startRef = useRef(start);
  const endRef = useRef(end);
  const resizeOriginRef = useRef({ start, end });
  const pressRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    longPressReady: false,
    blocked: false,
  });
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gestureMode, setGestureMode] = useState<GestureMode>("idle");
  const isMobile = useIsMobile();
  const previewX = useMotionValue(0);
  const previewY = useMotionValue(offsetY + index * GANTT_ROW_HEIGHT);
  const animatedX = useSpring(previewX, { damping: 34, stiffness: 480, mass: 0.7 });
  const animatedY = useSpring(previewY, { damping: 30, stiffness: 400, mass: 0.8 });

  const totalDuration = Math.max(1, differenceInSeconds(endDate, startDate));
  const dayWidth =
    (barRef.current?.parentElement?.offsetWidth || 1) /
    (totalDuration / GANTT_SECONDS_IN_DAY);
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
    resizeOriginRef.current = { start: taskStart, end: taskEnd };
  }, [task.endDate, task.startDate]);

  useEffect(() => {
    if (gestureMode !== "reorder") {
      previewY.set(offsetY + index * GANTT_ROW_HEIGHT);
    }
  }, [gestureMode, index, offsetY, previewY]);

  useEffect(() => {
    if (gestureMode !== "move") {
      previewX.set(0);
    }
  }, [gestureMode, previewX]);

  function clearLongPressTimeout() {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }

  function resetGestureState() {
    clearLongPressTimeout();
    pressRef.current.pointerId = -1;
    pressRef.current.longPressReady = false;
    pressRef.current.blocked = false;
    setGestureMode("idle");
    previewX.set(0);
    previewY.set(offsetY + index * GANTT_ROW_HEIGHT);
  }

  function commitMove(deltaX: number) {
    const daysDragged = Math.round(deltaX / dayWidth);
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
  }

  function commitReorder(deltaY: number) {
    const nextIndex = Math.max(
      0,
      Math.round((offsetY + index * GANTT_ROW_HEIGHT + deltaY - offsetY) / GANTT_ROW_HEIGHT),
    );
    if (nextIndex !== index) {
      onOrderChange?.(nextIndex);
    }
  }

  function beginResize(
    event: PointerEvent<HTMLDivElement>,
    direction: "left" | "right",
  ) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current.pointerId = event.pointerId;
    pressRef.current.startX = event.clientX;
    resizeOriginRef.current = {
      start: startRef.current,
      end: endRef.current,
    };
    setGestureMode(direction === "left" ? "resize-left" : "resize-right");
  }

  function updateResizePreview(deltaX: number) {
    const daysDragged = deltaX / dayWidth;
    if (gestureMode === "resize-left") {
      const nextStart = addSeconds(
        resizeOriginRef.current.start,
        daysDragged * GANTT_SECONDS_IN_DAY,
      );
      if (nextStart < resizeOriginRef.current.end) {
        setTaskStart(nextStart);
        startRef.current = nextStart;
      }
      return;
    }
    if (gestureMode === "resize-right") {
      const nextEnd = addSeconds(
        resizeOriginRef.current.end,
        daysDragged * GANTT_SECONDS_IN_DAY,
      );
      if (nextEnd > resizeOriginRef.current.start) {
        setTaskEnd(nextEnd);
        endRef.current = nextEnd;
      }
    }
  }

  return (
    <motion.div
      ref={barRef}
      initial={false}
      animate={{
        left,
      }}
      transition={{
        left: {
          type: "spring",
          damping: 34,
          stiffness: 480,
          mass: 0.7,
        },
      }}
      whileTap={{
        scale: 1.01,
        boxShadow: "0 16px 28px rgba(120, 139, 166, 0.18)",
      }}
      className="absolute cursor-grab"
      style={{
        width: barWidth,
        top: 0,
        x: animatedX,
        y: animatedY,
        zIndex: gestureMode === "idle" ? 1 : 50,
        height: GANTT_BAR_HEIGHT,
        willChange: "transform, left",
        touchAction: "none",
      }}
    >
      <div className="relative flex h-full w-full items-center">
        <span
          className={cn(
            "absolute right-full whitespace-nowrap pr-3 text-xs font-medium text-muted-foreground transition-opacity",
            gestureMode === "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          {format(start, "MMM d")} - {format(end, "MMM d")}
        </span>
        <div
          className="absolute left-0 z-10 h-full w-3 cursor-ew-resize"
          onPointerDown={(event) => beginResize(event, "left")}
          onPointerMove={(event) => {
            if (event.pointerId !== pressRef.current.pointerId) return;
            updateResizePreview(event.clientX - pressRef.current.startX);
          }}
          onPointerUp={() => {
            if (gestureMode === "resize-left") {
              onUpdate(startRef.current, endRef.current);
            }
            resetGestureState();
          }}
          onPointerCancel={resetGestureState}
        />
        <div
          className="absolute right-0 z-10 h-full w-3 cursor-ew-resize"
          onPointerDown={(event) => beginResize(event, "right")}
          onPointerMove={(event) => {
            if (event.pointerId !== pressRef.current.pointerId) return;
            updateResizePreview(event.clientX - pressRef.current.startX);
          }}
          onPointerUp={() => {
            if (gestureMode === "resize-right") {
              onUpdate(startRef.current, endRef.current);
            }
            resetGestureState();
          }}
          onPointerCancel={resetGestureState}
        />
        <Card
          className={cn(
            "h-full w-full border shadow-[10px_10px_18px_rgba(163,177,198,0.2),-10px_-10px_18px_rgba(255,255,255,0.88)] transition-shadow hover:ring-2 hover:ring-primary/15 hover:ring-offset-1 active:cursor-grabbing",
            statusClass,
            gestureMode !== "idle" && "ring-2 ring-primary/30 ring-offset-2 shadow-lg",
          )}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pressRef.current.pointerId = event.pointerId;
            pressRef.current.startX = event.clientX;
            pressRef.current.startY = event.clientY;
            pressRef.current.longPressReady = !isMobile;
            pressRef.current.blocked = false;
            setGestureMode("press");
            clearLongPressTimeout();
            if (isMobile) {
              longPressTimeoutRef.current = setTimeout(() => {
                pressRef.current.longPressReady = true;
              }, TOUCH_LONG_PRESS_MS);
            }
          }}
          onPointerMove={(event) => {
            if (event.pointerId !== pressRef.current.pointerId) return;
            const deltaX = event.clientX - pressRef.current.startX;
            const deltaY = event.clientY - pressRef.current.startY;
            let nextMode = gestureMode;
            if (nextMode === "press") {
              if (!pressRef.current.longPressReady) {
                if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > GESTURE_LOCK_PX) {
                  pressRef.current.blocked = true;
                  clearLongPressTimeout();
                }
                return;
              }
              const intent = detectGestureIntent(deltaX, deltaY);
              if (!intent) {
                return;
              }
              nextMode = intent;
              setGestureMode(nextMode);
            }
            if (nextMode === "move") {
              previewX.set(deltaX);
            }
            if (nextMode === "reorder") {
              previewY.set(offsetY + index * GANTT_ROW_HEIGHT + deltaY);
            }
          }}
          onPointerUp={(event) => {
            if (event.pointerId !== pressRef.current.pointerId) return;
            const deltaX = event.clientX - pressRef.current.startX;
            const deltaY = event.clientY - pressRef.current.startY;
            if (gestureMode === "press" && !pressRef.current.blocked) {
              onEdit?.();
            }
            if (gestureMode === "move") {
              commitMove(deltaX);
            }
            if (gestureMode === "reorder") {
              commitReorder(deltaY);
            }
            resetGestureState();
          }}
          onPointerCancel={resetGestureState}
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
