import { useRef, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { JiraTask } from "../../types/jira";

interface TaskBarProps {
  task: JiraTask;
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

  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const taskStartTime = new Date(task.startDate).getTime();
  const taskEndTime = new Date(task.endDate).getTime();
  const timelineStartTime = startDate.getTime();
  const timelineDuration = endDate.getTime() - startDate.getTime();
  
  // Calculate base position and width, ensuring exact date alignment
  const taskStartDate = new Date(task.startDate);
  taskStartDate.setHours(0, 0, 0, 0);
  const taskEndDate = new Date(task.endDate);
  taskEndDate.setHours(23, 59, 59, 999);

  // Normalize timeline start to midnight
  const timelineStart = new Date(startDate);
  timelineStart.setHours(0, 0, 0, 0);
  const timelineEnd = new Date(endDate);
  timelineEnd.setHours(23, 59, 59, 999);
  
  const position = ((taskStartDate.getTime() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;
  const width = ((taskEndDate.getTime() - taskStartDate.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;
  
  // Position relative to container, aligning with timeline grid
  const left = `${position}%`;
  const barWidth = `${width}%`;

  return (
    <motion.div
      ref={dragRef}
      drag
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={0.2}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
        cursor: "grabbing"
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        // Handle horizontal movement for timeline updates
        if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
          const dayWidth = (100 / totalDays) * zoom;
          const daysDragged = Math.round(info.offset.x / dayWidth);
          
          const newStartDate = new Date(task.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysDragged);
          
          const newEndDate = new Date(task.endDate);
          newEndDate.setDate(newEndDate.getDate() + daysDragged);
          
          onUpdate(newStartDate, newEndDate);
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
        position: 'absolute',
        zIndex: isDragging ? 50 : 1
      }}
      animate={{ 
        y: index * 48
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400,
        mass: 0.8
      }}
    >
      <div className="relative flex items-center w-full h-full">
        <span className="absolute right-full pr-2 text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(task.startDate), "MMM d")} - {format(new Date(task.endDate), "MMM d")}
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
          } ${isDragging ? 'ring-2 ring-primary/30 ring-offset-2 shadow-lg' : ''}`}
        />
      </div>
    </motion.div>
  );
}
