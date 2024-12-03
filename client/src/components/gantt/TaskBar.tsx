import { useRef } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { JiraTask } from "../../types/jira";

interface TaskBarProps {
  task: JiraTask;
  startDate: Date;
  endDate: Date;
  zoom: number;
  onUpdate: (startDate: Date, endDate: Date) => void;
}

export function TaskBar({
  task,
  startDate,
  endDate,
  zoom,
  onUpdate,
}: TaskBarProps) {
  const dragRef = useRef<HTMLDivElement>(null);

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
      drag="x"
      dragConstraints={dragRef}
      onDragEnd={(event, info) => {
        const dayWidth = (100 / totalDays) * zoom;
        const daysDragged = Math.round(info.offset.x / dayWidth);
        
        const newStartDate = new Date(task.startDate);
        newStartDate.setDate(newStartDate.getDate() + daysDragged);
        
        const newEndDate = new Date(task.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysDragged);
        
        onUpdate(newStartDate, newEndDate);
      }}
      className="absolute h-8 cursor-move"
      style={{ left, width }}
    >
      <Card
        className={`h-full px-2 py-1 text-sm truncate transition-colors flex items-center justify-between ${
          task.status.toUpperCase() === "DONE"
            ? "bg-green-100 hover:bg-green-200"
            : task.status.toUpperCase() === "IN PROGRESS"
            ? "bg-blue-100 hover:bg-blue-200"
            : task.status.toUpperCase() === "BLOCKED"
            ? "bg-red-100 hover:bg-red-200"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        <span>{task.name}</span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(task.startDate), "MMM d")} - {format(new Date(task.endDate), "MMM d")}
        </span>
      </Card>
    </motion.div>
  );
}
