"use client"
import Button from "@/components/ui/Button"
import { logout } from "@/lib/auth"

export default function Page() {
  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div className="rounded-xl border p-4">
        <div className="text-sm">API Base</div>
        <div className="font-mono">{process.env.NEXT_PUBLIC_API_BASE_URL}</div>
      </div>
      <Button onClick={()=>{ logout(); window.location.href="/login" }}>Logout</Button>
    </div>
  )
}
