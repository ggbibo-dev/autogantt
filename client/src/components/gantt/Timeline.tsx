import { format, differenceInSeconds, addSeconds } from "date-fns";
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
  // start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  // end.setHours(23, 59, 59, 999);

  const totalDuration = differenceInSeconds(end, start);

  // calculate number of labels
  const tickCount = Math.max(
    5, // Minimum ticks when extremely zoomed out
    Math.min(
      15, // Never more ticks than days
      Math.ceil(15 * zoom), // Non-linear scaling with zoom
    ),
  );

  // Calculate base width for exact day intervals
  const baseWidth = (1 / tickCount) * 100;

  const minPerStep = totalDuration / tickCount;
  // create an array which starts at start and each element increments by minPerStep
  const steps = Array.from({ length: tickCount }, (_, i) =>
    addSeconds(start, i * minPerStep + minPerStep/2),
  );

  // const step = Math.max(1, Math.floor((days.length - 1) / (tickCount)));
  // const filteredDays = days.filter((_, index) => index % step === 0);

  // Ensure timeline grid aligns with task bars
  const timelineStartTime = start.getTime();

  return (
    <div className="relative h-8 border-b">
      {/* Date labels and ticks */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={
          {
            // width: `${100 * zoom}%`,
            // minWidth: "100%",
            // overflow: "visible",
          }
        }
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
        {steps.map((day, index) => {
          const position = baseWidth * index;
          // const showTick =
          //   index % tickInterval === 0 ||
          //   index === 0 ||
          //   index === days.length - 1;

          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${position}%`,
                width: `${baseWidth}%`,
                height: "6px",
                // transform: "translateX(50%)",
                // borderLeftWidth: "1px" : "0px",
              }}
            >
              {/*<div className="absolute left-0 w-full flex justify-center">*/}
              <div className="absolute w-full flex justify-center">
                  <span className="text-xs whitespace-nowrap">
                    {format(day, "MMM dd HH:mm")}
                  </span>
              </div>
              <div className="h-5 w-px bg-gray-400"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
