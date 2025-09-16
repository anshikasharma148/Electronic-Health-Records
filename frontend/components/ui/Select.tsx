"use client"
import { SelectHTMLAttributes, forwardRef } from "react"
import { cn } from "@/utils/cn"

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cn("w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none focus:ring-2 ring-neutral-900", className)} {...p}>{children}</select>
))
Select.displayName = "Select"
export default Select
