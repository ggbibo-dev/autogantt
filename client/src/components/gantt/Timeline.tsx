import { format, eachDayOfInterval } from "date-fns";
import { motion } from "framer-motion";
import { useRef } from "react";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
  today?: Date;
  projectEndDate?: Date;
  onProjectEndDateChange?: (newDate: Date) => void;
}

export function Timeline({
  startDate,
  endDate,
  zoom,
  today = new Date(),
  projectEndDate,
  onProjectEndDateChange,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ensure dates start at midnight for exact alignment
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const days = eachDayOfInterval({ start, end });

  // Calculate tick interval based on zoom level and number of days
  const calculateTickInterval = () => {
    const totalDays = days.length;
    const baseTickCount = Math.max(
      5,
      Math.min(20, Math.ceil(totalDays * Math.pow(zoom, 2)))
    );
    return Math.max(1, Math.ceil(totalDays / baseTickCount));
  };

  const tickInterval = calculateTickInterval();
  const timelineStartTime = start.getTime();
  const timelineEndTime = end.getTime();

  return (
    <div className="relative h-8 overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          width: `${100 * zoom}%`,
          minWidth: "100%",
          position: "relative",
          overflowX: "auto",
          overflowY: "hidden"
        }}
      >
        {/* Today marker */}
        {today && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${((today.getTime() - timelineStartTime) / (timelineEndTime - timelineStartTime)) * 100}%`,
              zIndex: 5,
            }}
          >
            <div className="absolute -top-6 left-0 transform -translate-x-1/2">
              <span className="text-xs text-black/60 border-b border-black/60">
                Today
              </span>
            </div>
            <div className="absolute h-full w-px bg-black/20" />
          </div>
        )}

        {/* Project end date marker */}
        {projectEndDate && (
          <motion.div
            className="absolute top-0 bottom-0 cursor-ew-resize"
            style={{
              left: `${((projectEndDate.getTime() - timelineStartTime) / (timelineEndTime - timelineStartTime)) * 100}%`,
              zIndex: 5,
            }}
            drag="x"
            dragConstraints={containerRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (!containerRef.current || !onProjectEndDateChange) return;

              const container = containerRef.current;
              const rect = container.getBoundingClientRect();
              const position = (info.point.x - rect.left) / rect.width;
              const newTime = timelineStartTime + (timelineEndTime - timelineStartTime) * position;
              const newDate = new Date(newTime);

              if (newDate >= start && newDate <= end && (!today || newDate >= today)) {
                onProjectEndDateChange(newDate);
              }
            }}
          >
            <div className="absolute -top-6 left-0 transform -translate-x-1/2">
              <span className="text-xs text-red-400/80 border-b border-red-400/80">
                End
              </span>
            </div>
            <div className="absolute h-full w-px bg-red-400/40" />
          </motion.div>
        )}

        {/* Date ticks and labels */}
        {days.map((day, index) => {
          const showTick = index % tickInterval === 0 || index === 0 || index === days.length - 1;
          return (
            <div
              key={index}
              className="absolute top-0 h-full"
              style={{
                left: `${(index / (days.length - 1)) * 100}%`,
                borderLeft: showTick ? '1px solid #e2e8f0' : 'none',
              }}
            >
              {showTick && (
                <div className="absolute left-0 top-0 transform -translate-x-1/2">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {format(day, "MMM d")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}