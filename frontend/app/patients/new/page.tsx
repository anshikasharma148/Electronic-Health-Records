"use client"
import { useRouter } from "next/navigation"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Button from "@/components/ui/Button"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import { useState } from "react"

export default function Page() {
  const r = useRouter()
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.currentTarget as HTMLFormElement)
    const payload = {
      firstName: String(f.get("firstName")||""),
      lastName: String(f.get("lastName")||""),
      dob: String(f.get("dob")||""),
      gender: String(f.get("gender")||""),
      contact: { phone: String(f.get("phone")||""), email: String(f.get("email")||""), address: String(f.get("address")||"") }
    }
    try { const { data } = await api.post(API.patients.root, payload); r.push(`/patients/${data._id}`) } finally { setLoading(false) }
  }
  return (
    <div className="max-w-lg space-y-3">
      <h1 className="text-xl font-semibold">New Patient</h1>
      <form className="space-y-3" onSubmit={submit}>
        <Input name="firstName" placeholder="First name" />
        <Input name="lastName" placeholder="Last name" />
        <Input name="dob" type="date" />
        <Select name="gender"><option value="male">male</option><option value="female">female</option><option value="other">other</option></Select>
        <Input name="phone" placeholder="Phone" />
        <Input name="email" type="email" placeholder="Email" />
        <Input name="address" placeholder="Address" />
        <Button disabled={loading}>{loading?"...":"Create"}</Button>
      </form>
    </div>
  )
}
