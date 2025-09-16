"use client"
import { useCallback, useState } from "react"

export default function useToast() {
  const [m, set] = useState<string | null>(null)
  const show = useCallback((x: string) => { set(x); setTimeout(() => set(null), 2200) }, [])
  const Toast = () =>
    m ? (
      <div className="fixed bottom-4 right-4 px-3 py-2 rounded bg-neutral-900 text-white text-sm">
        {m}
      </div>
    ) : null
  return { show, Toast }
}
