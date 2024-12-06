import { format, eachDayOfInterval } from "date-fns";
import { motion } from "framer-motion";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
  today?: Date;
  projectEndDate?: Date;
  onProjectEndDateChange?: (newDate: Date) => void;
}

export function Timeline({ startDate, endDate, zoom, today = new Date(), projectEndDate, onProjectEndDateChange }: TimelineProps) {
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
    // Dynamic tick density that's more sensitive to zoom level
    const baseTickCount = Math.max(
      5,  // Minimum ticks when zoomed out
      Math.min(
        40, // Maximum ticks when zoomed in
        Math.ceil(totalDays * zoom * 0.4) // More aggressive zoom factor
      )
    );
    const interval = Math.max(1, Math.ceil(totalDays / baseTickCount));
    // Ensure we don't show too many or too few ticks
    return Math.min(Math.max(interval, 1), Math.ceil(totalDays / 5));
  };

  const tickInterval = calculateTickInterval();

  return (
    <div className="relative h-8 border-b">
      {/* Date labels and ticks */}
      <div 
        className="absolute inset-0"
        style={{
          width: '100%'
        }}
      >
        {/* Today's line - Aligned with content */}
        {today && (
          <div className="absolute" style={{
            left: `${((today.getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
            top: '48px', // Align with epic name row
            height: 'calc(100vh - 168px)', // Adjusted height
            zIndex: 5,
            pointerEvents: 'none'
          }}>
            <div className="absolute left-0 transform -translate-x-1/2">
              <span className="text-xs text-black/60 border-b border-black/60">Today</span>
            </div>
            <div className="absolute border-l border-black/20" style={{
              top: '20px', // Start below the label
              height: '100%',
              left: '0'
            }} />
          </div>
        )}
        
        {/* Project end date line - Aligned with content */}
        {projectEndDate && (
          <motion.div 
            className="absolute cursor-ew-resize" 
            style={{
              left: `${((new Date(projectEndDate.getTime() + 24 * 60 * 60 * 1000).getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
              top: '48px', // Align with epic name row
              height: 'calc(100vh - 168px)', // Adjusted height
              zIndex: 5,
            }}
            drag="x"
            dragConstraints={{ 
              left: 0,
              right: '100%'
            }}
            dragElastic={0.1}
            dragMomentum={false}
            whileDrag={{
              scale: 1.02,
              cursor: 'ew-resize',
              transition: { duration: 0.1 }
            }}
            onDragEnd={(e, info) => {
              if (!onProjectEndDateChange) return;
              
              const element = e.currentTarget as HTMLDivElement;
              if (!element) return;
              
              const container = element.parentElement?.closest('.relative.h-8');
              if (!container || !(container instanceof HTMLElement)) return;
              
              const timelineRect = container.getBoundingClientRect();
              const elementRect = element.getBoundingClientRect();
              
              // Calculate position relative to timeline
              const relativePosition = (elementRect.left - timelineRect.left) / timelineRect.width;
              
              // Convert position to date
              const timeRange = end.getTime() - start.getTime();
              const newTime = start.getTime() + (timeRange * relativePosition);
              const newEndDate = new Date(newTime);
              
              // Ensure the new end date is within the timeline bounds and not before today
              if (newEndDate >= start && newEndDate <= end && newEndDate >= today) {
                onProjectEndDateChange(newEndDate);
              }
            }}
          >
            <div className="absolute left-0 transform -translate-x-1/2">
              <span className="text-xs text-red-400/80 border-b border-red-400/80">End</span>
            </div>
            <div className="absolute border-l border-red-400/40" style={{
              top: '20px', // Start below the label
              height: '100%',
              left: '0'
            }} />
          </motion.div>
        )}

        {/* Date ticks and labels */}
        {days.map((day, index) => {
          const position = (index / days.length) * 100;
          const showTick = index % tickInterval === 0 || index === 0 || index === days.length - 1;
          
          return (
            <div
              key={index}
              className="absolute border-l"
              style={{
                left: `${position}%`,
                width: `${baseWidth}%`,
                height: showTick ? '6px' : '0px', // Reduced tick length
                borderLeftWidth: position === 0 ? '0px' : showTick ? '1px' : '0px'
              }}
            >
              {showTick && (
                <div
                  className="absolute left-0 w-full flex justify-center"
                  style={{
                    transform: `translateX(-50%)`
                  }}
                >
                  <span className="text-xs whitespace-nowrap px-2">{format(day, "MMM d")}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
