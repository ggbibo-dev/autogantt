import { useRef, useState } from "react";
import { format, differenceInSeconds, min, addDays, setDate } from "date-fns";
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

  const taskStartDate = formatInTimeZone(taskStart, 'America/New_York', 'yyyy-MM-dd HH:mm:ssXXX')
  const taskEndDate = formatInTimeZone(taskEnd, 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  const timelineStart = formatInTimeZone(new Date(startDate), 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  
  const timelineEnd = formatInTimeZone(new Date(endDate), 'America/New_York', "yyyy-MM-dd HH:mm:ssXXX");
  const totalDays = differenceInSeconds(timelineEnd, timelineStart);

  const position =
    (differenceInSeconds(taskStartDate, timelineStart) / totalDays) * 100;

  const width =
  (differenceInSeconds(min([taskEndDate, timelineEnd]), taskStartDate) / totalDays) * 100;

  const left = `${position}%`;
  const barWidth = `${width}%`;

  const secondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds

  return (
    <motion.div
      ref={dragRef}
      drag
      dragDirectionLock
      dragConstraints={{ left: 0 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={0.2}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
        cursor: "grabbing",
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);

        // Handle horizontal movement for timeline updates
        if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
          // Calculate the width of a single day in pixels
          const timelineWidth = dragRef.current?.parentElement?.offsetWidth || 1; // Total width of the timeline in pixels
          const dayWidth = timelineWidth / (totalDays / secondsInDay); // Width of a single day in pixels

          // Calculate the number of days dragged
          const daysDragged = Math.round(info.offset.x / dayWidth);

          // Update the start and end dates
          const newStartDate = addDays(new Date(task.startDate), daysDragged);
          const newEndDate = addDays(new Date(task.endDate), daysDragged);

          setTaskStart((p) => addDays(p, daysDragged));
          setTaskEnd((p) => addDays(p, daysDragged));

          // onUpdate(newStartDate, newEndDate);
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
