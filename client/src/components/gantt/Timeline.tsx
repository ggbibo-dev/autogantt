import { useEffect, useRef, useState } from "react";
import { addSeconds, differenceInSeconds, format } from "date-fns";
import {
  GANTT_COMPACT_TICK_WIDTH,
  GANTT_MAX_TICKS,
  GANTT_MIN_TICK_WIDTH,
  GANTT_MIN_TICKS,
} from "@/components/gantt/constants";

interface TimelineProps {
  startDate: Date;
  endDate: Date;
  zoom: number;
}

export function Timeline({ startDate, endDate, zoom }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const totalDuration = Math.max(1, differenceInSeconds(endDate, startDate));
  const totalDurationDays = totalDuration / (24 * 60 * 60);
  const zoomTickCount = Math.max(
    GANTT_MIN_TICKS,
    Math.min(GANTT_MAX_TICKS, Math.ceil(GANTT_MAX_TICKS * zoom)),
  );
  const widthBoundTickCount = containerWidth
    ? Math.max(
        GANTT_MIN_TICKS,
        Math.min(GANTT_MAX_TICKS, Math.floor(containerWidth / GANTT_MIN_TICK_WIDTH)),
      )
    : GANTT_MAX_TICKS;
  const tickCount = Math.min(zoomTickCount, widthBoundTickCount);
  const tickWidth = 100 / tickCount;
  const tickWidthPx = containerWidth / tickCount;
  const stepDuration = totalDuration / tickCount;
  const labelFormat =
    totalDurationDays > 3
      ? tickWidthPx < GANTT_COMPACT_TICK_WIDTH
        ? "MM/dd"
        : "MMM dd"
      : tickWidthPx < GANTT_COMPACT_TICK_WIDTH
        ? "MM/dd HH:mm"
        : "MMM dd HH:mm";
  const steps = Array.from({ length: tickCount }, (_, index) =>
    addSeconds(startDate, stepDuration * index + stepDuration / 2),
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative flex h-full items-center">
      {steps.map((step, index) => (
        <div
          key={`${step.toISOString()}-${index}`}
          className="absolute inset-y-0 flex items-center"
          style={{ left: `${tickWidth * index}%`, width: `${tickWidth}%` }}
        >
          <div className="flex w-full justify-center">
            <span className="whitespace-nowrap px-1 text-[11px] font-medium text-muted-foreground">
              {format(step, labelFormat)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
