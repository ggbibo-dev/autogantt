import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  GANTT_ZOOM_MAX,
  GANTT_ZOOM_MIN,
  GANTT_ZOOM_STEP,
} from "@/components/gantt/constants";

interface GanttToolbarProps {
  epicCount: number;
  modeLabel: string;
  taskCount: number;
  zoom: number;
  onBack: () => void;
  onForward: () => void;
  onExport: () => Promise<void> | void;
  onZoomChange: (zoom: number) => void;
}

export function GanttToolbar({
  epicCount,
  modeLabel,
  taskCount,
  zoom,
  onBack,
  onForward,
  onExport,
  onZoomChange,
}: GanttToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="neo-badge">{modeLabel}</div>
        <div className="neo-badge">{epicCount} epics</div>
        <div className="neo-badge">{taskCount} tasks</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          ←
        </Button>
        <Button type="button" variant="outline" onClick={onForward}>
          →
        </Button>
      </div>

      <div className="neo-inset flex min-w-[280px] items-center gap-4 rounded-[24px] px-4 py-3">
        <div className="space-y-1 pr-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Zoom
          </p>
          <p className="text-sm text-foreground">{zoom.toFixed(1)}x</p>
        </div>
        <Slider
          value={[zoom]}
          min={GANTT_ZOOM_MIN}
          max={GANTT_ZOOM_MAX}
          step={GANTT_ZOOM_STEP}
          onValueChange={([nextZoom]) => onZoomChange(nextZoom)}
          className="max-w-[220px]"
        />
        <Button type="button" onClick={onExport}>
          Export Chart
        </Button>
      </div>
    </div>
  );
}
