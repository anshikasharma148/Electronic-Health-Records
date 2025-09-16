"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { Table, T, Th, Td } from "@/components/ui/Table"

export default function Page() {
  const [items, setItems] = useState<any[]>([])
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { api.get(API.appointments.root, { params: { limit: 20 } }).then(r=>setItems(r.data.items||[])) }, [refresh])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget as HTMLFormElement)
    const payload = { patient: String(f.get("patient")||""), providerId: String(f.get("providerId")||""), start: String(f.get("start")||""), end: String(f.get("end")||""), reason: String(f.get("reason")||"") }
    await api.post(API.appointments.root, payload)
    setRefresh(x=>x+1)
    ;(e.currentTarget as HTMLFormElement).reset()
  }
  return (
    <div className="space-y-4">
      <form className="grid sm:grid-cols-5 gap-2" onSubmit={submit}>
        <Input name="patient" placeholder="PatientId" />
        <Input name="providerId" placeholder="ProviderId" />
        <Input name="start" type="datetime-local" />
        <Input name="end" type="datetime-local" />
        <Button>Book</Button>
        <Input name="reason" placeholder="Reason" className="sm:col-span-5" />
      </form>
      <Table>
        <T>
          <thead><tr><Th>Patient</Th><Th>Provider</Th><Th>Start</Th><Th>End</Th><Th>Status</Th></tr></thead>
          <tbody>{items.map((a:any)=>(<tr key={a._id}><Td>{typeof a.patient==="string"?a.patient:`${a.patient.firstName} ${a.patient.lastName}`}</Td><Td>{a.providerId}</Td><Td>{new Date(a.start).toLocaleString()}</Td><Td>{new Date(a.end).toLocaleString()}</Td><Td>{a.status}</Td></tr>))}</tbody>
        </T>
      </Table>
    </div>
  )
}
