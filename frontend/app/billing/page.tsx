"use client"
import { useEffect, useState } from "react"
import Input from "@/components/ui/Input"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import { Table, T, Th, Td } from "@/components/ui/Table"

export default function Page() {
  const [reports, setReports] = useState<any>(null)
  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [codes, setCodes] = useState<any[]>([])
  useEffect(() => { api.get(API.billing.reports).then(r=>setReports(r.data)) }, [])
  useEffect(() => { api.get(API.billing.codes, { params: { q, type, limit: 100 } }).then(r=>setCodes(r.data)) }, [q, type])
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-3">Reports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border p-4"><div className="text-sm text-neutral-500">Total Claims</div><div className="text-2xl font-semibold">{reports?.totalClaims ?? 0}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-neutral-500">Paid</div><div className="text-2xl font-semibold">{reports?.paid ?? 0}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-neutral-500">Denied</div><div className="text-2xl font-semibold">{reports?.denied ?? 0}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-neutral-500">Total Amount</div><div className="text-2xl font-semibold">{reports?.totalAmount ?? 0}</div></div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-3">Code Search</h2>
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <Input placeholder="Search code or description" value={q} onChange={e=>setQ(e.target.value)} />
          <Input placeholder="CPT|ICD|HCPCS" value={type} onChange={e=>setType(e.target.value)} />
        </div>
        <Table>
          <T>
            <thead><tr><Th>Code</Th><Th>Description</Th><Th>Fee</Th><Th>Type</Th></tr></thead>
            <tbody>{codes?.map((c:any)=><tr key={c.code}><Td>{c.code}</Td><Td>{c.description}</Td><Td>{c.fee}</Td><Td>{c.type}</Td></tr>)}</tbody>
          </T>
        </Table>
      </div>
    </div>
  )
}
