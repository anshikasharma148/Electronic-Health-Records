"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { signup } from "@/lib/auth"

export default function Page() {
  const r = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin"|"provider"|"billing"|"viewer">("viewer")
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await signup(email, password, role); r.replace("/dashboard") } finally { setLoading(false) }
  }
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 border rounded-xl p-6 bg-white">
        <h1 className="text-xl font-semibold">Create account</h1>
        <Input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <Select value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="viewer">viewer</option>
          <option value="provider">provider</option>
          <option value="billing">billing</option>
          <option value="admin">admin</option>
        </Select>
        <Button className="w-full" disabled={loading}>{loading?"...":"Sign up"}</Button>
      </form>
    </main>
  )
}
