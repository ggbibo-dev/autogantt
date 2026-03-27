import type { RefObject } from "react";
import { motion } from "framer-motion";
import { getTimelinePercent } from "@/components/gantt/utils";

interface TargetLinesProps {
  projectEndDate?: Date;
  start: Date;
  end: Date;
  today: Date;
  containerRef: RefObject<HTMLDivElement>;
  onProjectEndDateChange?: (newDate: Date) => void;
}

export function TargetLines({
  projectEndDate,
  start,
  end,
  today,
  containerRef,
  onProjectEndDateChange,
}: TargetLinesProps) {
  if (!projectEndDate) {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-y-0 z-10 cursor-ew-resize"
      style={{
        left: `${getTimelinePercent(projectEndDate, start, end)}%`,
      }}
      drag="x"
      dragConstraints={containerRef}
      dragElastic={0.1}
      dragMomentum={false}
      whileDrag={{
        scale: 1.02,
        cursor: "ew-resize",
        transition: { duration: 0.1 },
      }}
      onDragEnd={(event) => {
        if (!onProjectEndDateChange || !containerRef.current) {
          return;
        }

        const timelineRect = containerRef.current.getBoundingClientRect();
        const currentTarget = event.currentTarget as HTMLDivElement | null;
        if (!currentTarget) {
          return;
        }

        const elementRect = currentTarget.getBoundingClientRect();
        const relativePosition =
          (elementRect.left - timelineRect.left) / timelineRect.width;
        const timeRange = end.getTime() - start.getTime();
        const nextEndDate = new Date(start.getTime() + timeRange * relativePosition);

        if (nextEndDate >= start && nextEndDate <= end && nextEndDate >= today) {
          onProjectEndDateChange(nextEndDate);
        }
      }}
    >
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <span className="neo-badge border-none text-[11px] text-rose-600">
          End
        </span>
      </div>
      <div className="absolute inset-y-0 left-0 border-l border-rose-400/60" />
    </motion.div>
  );
}
