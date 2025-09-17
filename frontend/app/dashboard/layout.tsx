"use client"
import useAuthGuard from "@/hooks/useAuthGuard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard()
  return (
    <div className="min-h-screen grid grid-rows-[56px_1fr]">
      
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
