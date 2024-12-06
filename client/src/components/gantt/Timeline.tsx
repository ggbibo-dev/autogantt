import { format, eachDayOfInterval } from "date-fns";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
  today?: Date;
  projectEndDate?: Date;
}

export function Timeline({ startDate, endDate, zoom, today = new Date(), projectEndDate }: TimelineProps) {
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
    // Reduce max ticks significantly when zoomed out
    const maxVisibleTicks = Math.max(
      5,
      Math.min(
        15,
        Math.ceil(10 * zoom)
      )
    );
    return Math.max(1, Math.ceil(totalDays / maxVisibleTicks));
  };

  const tickInterval = calculateTickInterval();

  return (
    <div className="relative h-8 border-b">
      <div 
        className="absolute inset-0"
        style={{
          width: '100%'
        }}
      >
        {/* Today's line */}
        {today && (
          <div
            className="absolute border-l border-black/20"
            style={{
              left: `${((today.getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
              top: '48px', // Start at the first row
              height: 'calc(100vh - 48px)', // Fill remaining space
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            <div className="absolute left-0 transform -translate-x-1/2" style={{ top: '-20px' }}>
              <span className="text-xs text-black/60 border-b border-black/60">Today</span>
            </div>
          </div>
        )}
        
        {/* Project end date line */}
        {projectEndDate && (
          <div
            className="absolute border-l border-red-400/40"
            style={{
              left: `${((projectEndDate.getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
              top: '48px', // Start at the first row
              height: 'calc(100vh - 48px)', // Fill remaining space
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            <div className="absolute left-0 transform -translate-x-1/2" style={{ top: '-20px' }}>
              <span className="text-xs text-red-400/80 border-b border-red-400/80">End</span>
            </div>
          </div>
        )}

        {days.map((day, index) => {
          const position = (index / days.length) * 100;
          const showTick = index % tickInterval === 0 || index === 0 || index === days.length - 1;
          
          return (
            <div
              key={index}
              className="absolute border-l h-full"
              style={{
                left: `${position}%`,
                width: `${baseWidth}%`,
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
