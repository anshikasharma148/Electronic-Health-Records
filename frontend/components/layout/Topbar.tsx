"use client"
import Link from "next/link"

export default function Topbar() {
  return (
    <header className="h-14 border-b flex items-center px-4 justify-between bg-white">
      <div className="font-semibold">EHR</div>
      <nav className="text-sm flex gap-4">
        <Link href="/dashboard">Overview</Link>
        <Link href="/patients">Patients</Link>
        <Link href="/appointments">Appointments</Link>
        <Link href="/clinical">Clinical</Link>
        <Link href="/billing">Billing</Link>
        <Link href="/settings">Settings</Link>
      </nav>
    </header>
  )
}
