import { format, eachDayOfInterval } from "date-fns";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
}

export function Timeline({ startDate, endDate, zoom }: TimelineProps) {
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

  return (
    <div className="relative h-8 border-b overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          width: '100%'
        }}
      >
        {days.map((day, index) => {
          const position = (index / days.length) * 100;
          
          return (
            <div
              key={index}
              className="absolute border-l h-full"
              style={{
                left: `${position}%`,
                width: `${baseWidth}%`,
                borderLeftWidth: position === 0 ? '0px' : '1px' // No left border for first tick
              }}
            >
              <div
                className="absolute left-0 w-full flex justify-center"
                style={{
                  transform: `translateX(-50%)`
                }}
              >
                <span className="text-xs whitespace-nowrap px-2">{format(day, "MMM d")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
