"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { login } from "@/lib/auth"

export default function Page() {
  const r = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      r.replace("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 border rounded-xl p-6 bg-white">
        <h1 className="text-xl font-semibold">Login</h1>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button className="w-full" disabled={loading}>
          {loading ? "..." : "Sign in"}
        </Button>

        <div className="text-sm text-neutral-600 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </form>
    </main>
  )
}
