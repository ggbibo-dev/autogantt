import React, { useRef } from "react";
import { motion } from "framer-motion";

interface TargetLinesProps {
    projectEndDate: Date | undefined;
    timelineStartTime: number;
    start: Date;
    end: Date;
    today: Date;
    maxBoundingWidth: number;
    onProjectEndDateChange?: (newDate: Date) => void;
}

const TargetLines: React.FC<TargetLinesProps> = ({
    projectEndDate,
    timelineStartTime,
    start,
    end,
    today,
    maxBoundingWidth,
    onProjectEndDateChange,
}) => {

    const containerRef = useRef<HTMLDivElement>(null);
    return (
        <>
            {/* Project end date line */}
            {projectEndDate && (
                <motion.div
                    ref={containerRef}
                    className="absolute cursor-ew-resize h-full z-[5] -mt-[15px]"
                    style={{
                        left: `${((new Date(projectEndDate.getTime() + 24 * 60 * 60 * 1000).getTime() - timelineStartTime) / (end.getTime() - timelineStartTime)) * 100}%`,
                    }}
                    drag="x"
                    dragConstraints={{
                        left: 0,
                        right: maxBoundingWidth,
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
        </>
    );
};

export {TargetLines};