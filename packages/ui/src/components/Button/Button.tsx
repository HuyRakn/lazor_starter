'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils"

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7857ff]/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden backdrop-blur-2xl",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#7857ff]/80 via-[#7857ff]/75 to-[#7857ff]/80 text-white border border-[#7857ff]/50 shadow-[0_0_14px_rgba(120,87,255,0.4),0_0_28px_rgba(120,87,255,0.3),0_12px_26px_-14px_rgba(120,87,255,0.55),inset_0_-4px_9px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] hover:bg-gradient-to-r hover:from-[#7857ff] hover:via-[#7857ff] hover:to-[#7857ff] active:scale-[0.98] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.38),0_0_20px_rgba(120,87,255,0.4)]",
        destructive:
          "bg-gradient-to-r from-rose-600/55 via-red-500/45 to-red-600/55 text-white border border-rose-200/20 shadow-[0_0_14px_rgba(225,29,72,0.26),0_0_28px_rgba(225,29,72,0.16),0_12px_26px_-14px_rgba(225,29,72,0.48),inset_0_-4px_9px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:scale-[1.02] active:scale-[0.98] active:shadow-[inset_0_6px_12px_rgba(0,0,0,0.4),0_0_20px_rgba(225,29,72,0.25)]",
        outline:
          "border border-white/10 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/10",
        secondary:
          "bg-gray-900/60 text-white backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-4px_10px_rgba(0,0,0,0.5)] hover:bg-gray-800/80",
        ghost: "text-white hover:bg-white/5",
        link: "text-[#7857ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const hasLiquidSheen = variant === 'default'

    const content = (
      <>
        {hasLiquidSheen && (
          <>
            <span className="absolute inset-0 rounded-[inherit] pointer-events-none">
              <span className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/28 via-white/8 to-transparent blur-[0.6px]" />
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            </span>
            <span className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden">
              <span className="absolute inset-[-25%] bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.18),transparent_36%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.14),transparent_40%),radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.1),transparent_46%)] opacity-65 blur-[6px]" />
              <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12) 8%,rgba(255,255,255,0) 18%,rgba(255,255,255,0.1) 28%,rgba(255,255,255,0) 38%)] mix-blend-screen opacity-70" />
              <span className="absolute top-[22%] left-[10%] w-2 h-2 rounded-full bg-white/30 blur-[1px] opacity-80 shadow-[60px_5px_0_rgba(255,255,255,0.18),30px_15px_0_rgba(255,255,255,0.14),80px_-6px_0_rgba(255,255,255,0.1)]" />
            </span>
          </>
        )}
        <span className="relative z-10 flex items-center gap-2 drop-shadow-sm whitespace-nowrap">
          {children}
        </span>
      </>
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

