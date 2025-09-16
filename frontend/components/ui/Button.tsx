"use client"
import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/utils/cn"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid"|"outline" }
const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant="solid", ...p }, ref) => {
  const base = "px-3 py-2 rounded-lg text-sm transition"
  const styles = variant==="solid" ? "bg-neutral-900 text-white hover:bg-neutral-800" : "border border-neutral-900 hover:bg-neutral-900/5"
  return <button ref={ref} className={cn(base, styles, className)} {...p} />
})
Button.displayName = "Button"
export default Button
