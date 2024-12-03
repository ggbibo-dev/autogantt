import { format, eachDayOfInterval } from "date-fns";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
}

export function Timeline({ startDate, endDate, zoom }: TimelineProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="relative h-8 border-b">
      {days.map((day, index) => (
        <div
          key={index}
          className="absolute border-l h-full flex flex-col items-center text-xs"
          style={{
            left: `${(index / days.length) * 100 * zoom}%`,
            width: `${(1 / days.length) * 100 * zoom}%`,
          }}
        >
          <span className="mb-1">{format(day, "MMM d")}</span>
        </div>
      ))}
    </div>
  );
}
