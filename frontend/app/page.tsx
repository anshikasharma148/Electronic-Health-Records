"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const r = useRouter()
  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null
    r.replace(t ? "/dashboard" : "/login")
  }, [r])
  return null
}
