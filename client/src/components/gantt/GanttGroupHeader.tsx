import { cn } from "@/lib/utils";

interface GanttGroupHeaderProps {
  title: string;
  variant?: "list" | "canvas";
}

export function GanttGroupHeader({
  title,
  variant = "list",
}: GanttGroupHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3",
        variant === "canvas" && "opacity-80",
      )}
    >
      <div className="h-px flex-1 bg-white/45" />
      <div
        className={cn(
          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
          variant === "list"
            ? "bg-white/28 text-slate-600"
            : "bg-white/18 text-slate-500",
        )}
      >
        {title}
      </div>
      <div className="h-px flex-1 bg-white/45" />
    </div>
  );
}
