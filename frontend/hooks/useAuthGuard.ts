"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function useAuthGuard() {
  const r = useRouter()
  useEffect(() => { const t = localStorage.getItem("token"); if (!t) r.replace("/login") }, [r])
}
