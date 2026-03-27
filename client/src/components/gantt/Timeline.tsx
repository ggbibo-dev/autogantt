import { addSeconds, differenceInSeconds, format } from "date-fns";
import {
  GANTT_MAX_TICKS,
  GANTT_MIN_TICKS,
} from "@/components/gantt/constants";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
}

export function Timeline({ startDate, endDate, zoom }: TimelineProps) {
  const totalDuration = Math.max(1, differenceInSeconds(endDate, startDate));
  const totalDurationDays = totalDuration / (24 * 60 * 60);
  const tickCount = Math.max(
    GANTT_MIN_TICKS,
    Math.min(GANTT_MAX_TICKS, Math.ceil(GANTT_MAX_TICKS * zoom)),
  );
  const tickWidth = 100 / tickCount;
  const stepDuration = totalDuration / tickCount;
  const labelFormat = totalDurationDays > 3 ? "MMM dd" : "MMM dd HH:mm";
  const steps = Array.from({ length: tickCount }, (_, index) =>
    addSeconds(startDate, stepDuration * index + stepDuration / 2),
  );

  return (
    <div className="relative h-full">
      {steps.map((step, index) => (
        <div
          key={`${step.toISOString()}-${index}`}
          className="absolute inset-y-0"
          style={{ left: `${tickWidth * index}%`, width: `${tickWidth}%` }}
        >
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
              {format(step, labelFormat)}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 top-5 w-px bg-slate-300/80" />
        </div>
      ))}
    </div>
  );
}
