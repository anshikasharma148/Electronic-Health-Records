"use client"
import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn("w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:ring-2 ring-neutral-900", className)} {...p} />
))
Input.displayName = "Input"
export default Input
