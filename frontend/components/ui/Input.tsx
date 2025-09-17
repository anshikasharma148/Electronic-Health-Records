// components/ui/Input.tsx
"use client"
import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/utils/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, hasError, ...props }, ref) => (
  <input 
    ref={ref} 
    className={cn(
      "w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 transition-colors",
      hasError 
        ? "border-red-500 focus:ring-red-500" 
        : "border-neutral-300 focus:ring-neutral-900 focus:border-neutral-900",
      className
    )} 
    {...props} 
  />
))
Input.displayName = "Input"
export default Input