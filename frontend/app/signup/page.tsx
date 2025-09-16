"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { signup } from "@/lib/auth"

type Role = "admin" | "provider" | "billing" | "viewer"

export default function Page() {
  const r = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("viewer")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const safeEmail = email.trim().toLowerCase()

    try {
      await signup(safeEmail, password, role)
      r.replace("/dashboard")
    } catch (ex: any) {
      const status = ex?.response?.status
      const raw = String(ex?.response?.data?.message || ex?.message || "")
      const isDuplicate =
        status === 409 || /E11000|duplicate key|already exists|exist/i.test(raw)

      if (isDuplicate) {
        alert("An account with this email already exists. Please log in.")
        r.replace("/login")
      } else {
        alert("Could not create the account. Please try again or contact the admin.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 border rounded-xl p-6 bg-white">
        <h1 className="text-xl font-semibold">Create account</h1>

        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Select value={role} onChange={e => setRole(e.target.value as Role)}>
          <option value="viewer">viewer</option>
          <option value="provider">provider</option>
          <option value="billing">billing</option>
          <option value="admin">admin</option>
        </Select>

        <Button className="w-full" disabled={loading}>
          {loading ? "..." : "Sign up"}
        </Button>

        <div className="text-sm text-neutral-600 text-center">
          Already have an account?{" "}
          <Link href="/login" className="underline">Log in</Link>
        </div>
      </form>
    </main>
  )
}
