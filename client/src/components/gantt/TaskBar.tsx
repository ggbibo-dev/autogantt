import { PointerEvent, useRef, useState } from "react";
import { format, differenceInSeconds, min, addDays, setDate, startOfDay, addSeconds } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { Task } from "@db/schema";
import type { JiraTask } from "@/types/jira";

interface TaskBarProps {
  task: Task & Partial<JiraTask>;
  startDate: Date;
  endDate: Date;
  zoom: number;
  index: number;
  onUpdate: (startDate: Date, endDate: Date) => void;
  onOrderChange?: (newIndex: number) => void;
}

export function TaskBar({
  task,
  startDate,
  endDate,
  zoom,
  index,
  onUpdate,
  onOrderChange,
}: TaskBarProps) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const taskStart = new Date(task.startDate)
  taskStart.setHours(0,0,0,0)
  const taskEnd = new Date(task.endDate)
  taskEnd.setHours(12,0,0,0)
  
  const [start, setTaskStart] = useState(taskStart);
  const [end, setTaskEnd] = useState(taskEnd);

  const [isResizing, setIsResizing] = useState(false);
  
  const taskStartDate = formatInTimeZone(taskStart, 'America/New_York', 'yyyy-MM-dd HH:mm:ssXXX')
  const taskEndDate = formatInTimeZone(taskEnd, 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  const timelineStart = formatInTimeZone(new Date(startDate), 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  
  const timelineEnd = formatInTimeZone(new Date(endDate), 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  const totalDays = differenceInSeconds(timelineEnd, timelineStart);
  
  const position =
  (differenceInSeconds(start, timelineStart) / totalDays) * 100;
  
  const width =
  (differenceInSeconds(min([end, timelineEnd]), taskStartDate) / totalDays) * 100;
  
  const left = `${position}%`;
  const barWidth = `${width}%`;
  
  const secondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds
  
  function handleResizeStart(e: PointerEvent<HTMLDivElement>, direction: "left" | "right"): void {
  
    const initialX = e.clientX;
    const initialStart = start;
    const initialEnd = end;
  
    function onMouseMove(event: MouseEvent) {
      const deltaX = event.clientX - initialX;
      const timelineWidth = dragRef.current?.parentElement?.offsetWidth || 1;
      const dayWidth = timelineWidth / (totalDays / secondsInDay);
      const daysDragged = deltaX / dayWidth;
  
      if (direction === "left") {
        const newStart = addSeconds(initialStart, daysDragged * secondsInDay);
        if (newStart < initialEnd) {
          setTaskStart(newStart);
          
          // onUpdate(newStart, initialEnd);
        }
      } else if (direction === "right") {
        const newEnd = addSeconds(initialEnd, daysDragged * secondsInDay);
        if (newEnd > initialStart) {
          setTaskEnd(newEnd);
          // onUpdate(initialStart, newEnd);
        }
      }
    }

    function onMouseDown(event: MouseEvent) {
      e.stopPropagation();
      setIsResizing(true);
      // e.preventDefault();
      console.log("mouse down")
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);

      console.log("mouse up")
      
      setIsResizing(false);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    
  }

  return (
    <motion.div
      ref={dragRef}
      drag={!isResizing}
      dragDirectionLock
      dragConstraints={{ left: 0 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={{
        right: 0
      }}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
        cursor: isResizing ? "ew-resize" : "grabbing",
      }}
      onDragStart={() => setIsDragging(!isResizing ? true: false)}
      onDragEnd={(event, info) => {
        if (isResizing) return;
        setIsDragging(false);

        // Handle horizontal movement for timeline updates
        if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
          // Calculate the width of a single day in pixels
          const timelineWidth = dragRef.current?.parentElement?.offsetWidth || 1; // Total width of the timeline in pixels
          const dayWidth = timelineWidth / (totalDays / secondsInDay); // Width of a single day in pixels

          // Calculate the number of days dragged
          const daysDragged = Math.round(info.offset.x / dayWidth);

          // Update the start and end dates
          setTaskStart((p) => addDays(p, daysDragged));
          setTaskEnd((p) => addDays(p, daysDragged));
          
          // Notes due to batching of state changes, do not use state, persist to DB
          // onUpdate(addDays(start, daysDragged), addDays(end, daysDragged));
        } else if (Math.abs(info.offset.y) > 10) {
          // Handle vertical reordering with snapping
          const rowHeight = 48; // Height of each row
          const container = dragRef.current?.parentElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = dragRef.current?.getBoundingClientRect();
            if (elementRect) {
              const relativeY = elementRect.top - containerRect.top;
              const newIndex = Math.max(0, Math.round(relativeY / rowHeight));

              if (newIndex !== index && newIndex >= 0) {
                onOrderChange?.(newIndex);
              }
            }
          }
        }
      }}
      className="absolute h-10 cursor-move"
      style={{
        left,
        width: barWidth,
        top: 0,
        position: "absolute",
        zIndex: isDragging ? 50 : 1,
        cursor: isResizing ? "ew-resize" : "grabbing",
      }}
      animate={{
        y: index * 48,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400,
        mass: 0.8,
      }}
    >
      <div className="relative flex items-center w-full h-full">
        <span className="absolute right-full pr-2 text-xs text-muted-foreground whitespace-nowrap">
          {format(start, "MMM d")} -{" "}
          {format(end, "MMM d")}
        </span>
        <div
          className="absolute left-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(e) => handleResizeStart(e, "left")}
        />
        <div
          className="absolute right-0 h-full w-2 cursor-ew-resize"
          onPointerDown={(e) => handleResizeStart(e, "right")}
        />
        <Card
          className={`h-full w-full cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-offset-1 hover:ring-primary/20 transition-shadow ${
            task.status.toUpperCase() === "DONE"
              ? "bg-green-100 hover:bg-green-100/90"
              : task.status.toUpperCase() === "IN PROGRESS"
                ? "bg-blue-100 hover:bg-blue-100/90"
                : task.status.toUpperCase() === "BLOCKED"
                  ? "bg-red-100 hover:bg-red-100/90"
                  : "bg-gray-100 hover:bg-gray-100/90"
          } ${isDragging ? "ring-2 ring-primary/30 ring-offset-2 shadow-lg" : ""}`}
        />
      </div>
    </motion.div>
  );
}
