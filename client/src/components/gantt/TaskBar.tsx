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
  
  const left = `${((taskStartTime - timelineStartTime) / timelineDuration) * 100}%`;
  const width = `${((taskEndTime - taskStartTime) / timelineDuration) * 100}%`;

  return (
    <motion.div
      ref={dragRef}
      drag
      dragDirectionLock
      dragConstraints={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
      dragMomentum={false}
      dragElastic={0.2}
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
        width,
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
      <Card
        className={`h-full px-2 py-1 text-sm flex items-center justify-center ${
          task.status.toUpperCase() === "DONE"
            ? "bg-green-100 hover:bg-green-200"
            : task.status.toUpperCase() === "IN PROGRESS"
            ? "bg-blue-100 hover:bg-blue-200"
            : task.status.toUpperCase() === "BLOCKED"
            ? "bg-red-100 hover:bg-red-200"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(task.startDate), "MMM d")} - {format(new Date(task.endDate), "MMM d")}
        </span>
      </Card>
    </motion.div>
  );
}
