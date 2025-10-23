import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"

  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300",
    outline:
      "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300",
    ghost: "text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-200"
  }

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
