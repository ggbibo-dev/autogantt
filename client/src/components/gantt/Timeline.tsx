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

function getDaysBetweenDates(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
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

  // Calculate base width for exact day intervals
  const baseWidth = (1 / days.length) * 100;
  const scaledWidth = baseWidth * zoom;

  // Ensure timeline grid aligns with task bars
  const timelineStartTime = start.getTime();

  // Calculate tick interval based on zoom level and number of days
  const calculateTickInterval = () => {
    const totalDays = days.length;
    // Base number of ticks inversely proportional to zoom level
    const baseTickCount = Math.max(
      5, // Minimum ticks when extremely zoomed out
      Math.min(
        20, // Never more ticks than days
        Math.ceil(totalDays * Math.pow(zoom, 0.2)) // Non-linear scaling with zoom
      )
    );
    
    // Calculate interval ensuring even distribution
    const interval = Math.max(1, Math.ceil(totalDays / baseTickCount));
    
    // Round to nearest convenient interval (1, 2, 5, 10, etc.)
    const roundedInterval = interval <= 2 ? interval : 
                          interval <= 5 ? 5 :
                          interval <= 10 ? 10 :
                          Math.ceil(interval / 10) * 10;
    
    return roundedInterval;
  };

  const tickInterval = calculateTickInterval();

  return (
    <div className="relative h-8 border-b">
      {/* Date labels and ticks */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          width: `${100 * zoom}%`,
          minWidth: "100%",
          overflow: "visible"
        }}
      >
        {/* Today's line */}
        {today && (
          <div
            className="absolute"
            style={{
              left: `${((today.getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
              top: "48px",
              height: "calc(100vh - 168px)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <div className="absolute left-0 transform -translate-x-1/2">
              <span className="text-xs text-black/60 border-b border-black/60">
                Today
              </span>
            </div>
            <div
              className="absolute border-l border-black/20"
              style={{
                top: "20px",
                height: "100%",
                left: "0",
              }}
            />
          </div>
        )}

        {/* Project end date line */}
        {projectEndDate && (
          <motion.div
            className="absolute cursor-ew-resize"
            style={{
              left: `${((new Date(projectEndDate.getTime() + 24 * 60 * 60 * 1000).getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
              top: "48px",
              height: "calc(100vh - 168px)",
              zIndex: 5,
            }}
            drag="x"
            dragConstraints={{
              left: 0,
              right: containerRef.current?.getBoundingClientRect().width || 0,
            }}
            dragElastic={0.1}
            dragMomentum={false}
            whileDrag={{
              scale: 1.02,
              cursor: "ew-resize",
              transition: { duration: 0.1 },
            }}
            onDragEnd={(e, info) => {
              if (!onProjectEndDateChange) return;

              const element = e.currentTarget as HTMLDivElement;
              if (!element) return;

              const container = containerRef.current;
              if (!container) return;

              const timelineRect = container.getBoundingClientRect();
              const elementRect = element.getBoundingClientRect();

              const relativePosition =
                (elementRect.left - timelineRect.left) / timelineRect.width;

              const timeRange = end.getTime() - start.getTime();
              const newTime = start.getTime() + timeRange * relativePosition;
              const newEndDate = new Date(newTime);

              if (
                newEndDate >= start &&
                newEndDate <= end &&
                newEndDate >= today
              ) {
                onProjectEndDateChange(newEndDate);
              }
            }}
          >
            <div className="absolute left-0 transform -translate-x-1/2">
              <span className="text-xs text-red-400/80 border-b border-red-400/80">
                End
              </span>
            </div>
            <div
              className="absolute border-l border-red-400/40"
              style={{
                top: "20px",
                height: "100%",
                left: "0",
              }}
            />
          </motion.div>
        )}

        {/* Date ticks and labels */}
        {days.map((day, index) => {
          const position = (index / days.length) * 100;
          const showTick =
            index % tickInterval === 0 ||
            index === 0 ||
            index === days.length - 1;

          return (
            <div
              key={index}
              className="absolute border-l"
              style={{
                left: `${position}%`,
                width: `${baseWidth}%`,
                height: showTick ? "6px" : "0px",
                borderLeftWidth: showTick ? "1px" : "0px",
              }}
            >
              {showTick && (
                <div className="absolute left-0 w-full flex justify-center">
                  <span className="text-xs whitespace-nowrap px-2">
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
