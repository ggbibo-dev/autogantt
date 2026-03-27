import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "neo-button text-slate-700",
        destructive:
          "border-rose-200/80 bg-[linear-gradient(145deg,rgba(255,245,246,0.95),rgba(247,210,219,0.88))] text-rose-700 shadow-[8px_8px_16px_rgba(163,177,198,0.24),-8px_-8px_16px_rgba(255,255,255,0.9)] hover:translate-y-[1px] hover:shadow-[inset_6px_6px_12px_rgba(207,174,182,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.92)]",
        outline:
          "neo-button-outline text-slate-600",
        secondary:
          "neo-button-outline text-slate-600",
        ghost: "neo-button-ghost text-slate-600",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
