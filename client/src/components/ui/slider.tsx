import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="neo-inset relative h-3 w-full grow overflow-hidden rounded-full border border-white/60">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-[linear-gradient(90deg,rgba(101,140,199,0.95),rgba(143,184,228,0.95))]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="neo-button block h-6 w-6 rounded-full border border-white/70 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
