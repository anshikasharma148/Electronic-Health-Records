"use client"
import { useEffect, useState } from "react"
import Input from "@/components/ui/Input"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import { Table, T, Th, Td } from "@/components/ui/Table"

export default function Page() {
  const [patientId, setPatientId] = useState("")
  const [data, setData] = useState<any>(null)
  useEffect(() => { if (patientId) api.get(API.clinical.overview, { params: { patientId } }).then(r=>setData(r.data)) }, [patientId])
  return (
    <div className="space-y-4">
      <Input placeholder="PatientId" value={patientId} onChange={e=>setPatientId(e.target.value)} />
      <div className="grid md:grid-cols-3 gap-4">
        <div><div className="font-medium mb-2">Notes</div><Table><T><thead><tr><Th>Text</Th></tr></thead><tbody>{data?.notes?.map((n:any)=><tr key={n._id}><Td>{n.text}</Td></tr>)}</tbody></T></Table></div>
        <div><div className="font-medium mb-2">Vitals</div><Table><T><thead><tr><Th>When</Th><Th>HR</Th><Th>BP</Th></tr></thead><tbody>{data?.vitals?.map((v:any)=><tr key={v._id}><Td>{new Date(v.recordedAt).toLocaleString()}</Td><Td>{v.heartRate||"-"}</Td><Td>{v.bpSystolic||"-"}/{v.bpDiastolic||"-"}</Td></tr>)}</tbody></T></Table></div>
        <div><div className="font-medium mb-2">Labs</div><Table><T><thead><tr><Th>Test</Th><Th>Value</Th></tr></thead><tbody>{data?.labs?.map((l:any)=><tr key={l._id}><Td>{l.testName}</Td><Td>{l.value} {l.unit||""}</Td></tr>)}</tbody></T></Table></div>
      </div>
    </div>
  )
}
