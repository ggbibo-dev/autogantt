import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  GANTT_ZOOM_MAX,
  GANTT_ZOOM_MIN,
  GANTT_ZOOM_STEP,
} from "@/components/gantt/constants";

interface GanttToolbarProps {
  zoom: number;
  onBack: () => void;
  onForward: () => void;
  onExport: () => Promise<void> | void;
  onZoomChange: (zoom: number) => void;
}

export function GanttToolbar({
  zoom,
  onBack,
  onForward,
  onExport,
  onZoomChange,
}: GanttToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ←
        </Button>
        <Button type="button" variant="outline" onClick={onForward}>
          →
        </Button>
      </div>

      <div className="flex min-w-[240px] items-center gap-4">
        <div className="space-y-1">
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
        />
        <Button type="button" onClick={onExport}>
          Export Chart
        </Button>
      </div>
    </div>
  );
}
