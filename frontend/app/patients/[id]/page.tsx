"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { Patient } from "@/types/api"

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { api.get(API.patients.one(id)).then(r=>setPatient(r.data)) }, [id])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.currentTarget as HTMLFormElement)
    const payload = { contact: { phone: String(f.get("phone")||""), email: String(f.get("email")||""), address: String(f.get("address")||"") } }
    try { const { data } = await api.put(API.patients.one(id), payload); setPatient(data) } finally { setSaving(false) }
  }
  if (!patient) return null
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-xl font-semibold">{patient.firstName} {patient.lastName}</h1><div className="text-sm text-neutral-600">{new Date(patient.dob).toLocaleDateString()} • {patient.gender}</div></div>
      <form className="space-y-3" onSubmit={submit}>
        <Input name="phone" placeholder="Phone" defaultValue={patient.contact?.phone} />
        <Input name="email" placeholder="Email" defaultValue={patient.contact?.email} />
        <Input name="address" placeholder="Address" defaultValue={patient.contact?.address} />
        <Button disabled={saving}>{saving?"...":"Save"}</Button>
      </form>
    </div>
  )
}
