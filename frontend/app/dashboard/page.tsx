"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"

export default function Page() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { api.get(API.billing.reports).then(r => setData(r.data)).catch(() => {}) }, [])
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total Claims</div>
          <div className="text-2xl font-semibold">{data?.totalClaims ?? 0}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Paid</div>
          <div className="text-2xl font-semibold">{data?.paid ?? 0}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Pending</div>
          <div className="text-2xl font-semibold">{data?.pending ?? 0}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total Amount</div>
          <div className="text-2xl font-semibold">{data?.totalAmount ?? 0}</div>
        </div>
      </div>
    </div>
  )
}
