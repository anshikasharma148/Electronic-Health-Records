"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { api } from "@/lib/api"
import { API } from "@/lib/endpoints"
import { Table, T, Th, Td } from "@/components/ui/Table"
import { Paginated, Patient } from "@/types/api"

export default function Page() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paginated<Patient> | null>(null)

  useEffect(() => {
    const load = async () => {
      const r = await api.get(API.patients.root, { params: { q, page, limit: 10 } })
      setData(r.data)
    }
    load()
  }, [q, page])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search name/phone/email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setPage(1)}>Search</Button>
        <Link href="/patients/new" className="px-3 py-2 rounded-lg bg-neutral-900 text-white">New</Link>
      </div>

      <Table>
        <T>
          <thead>
            <tr><Th>Name</Th><Th>DOB</Th><Th>Gender</Th><Th /></tr>
          </thead>
          <tbody>
            {data?.items?.map((p) => (
              <tr key={p._id}>
                <Td>{p.firstName} {p.lastName}</Td>
                <Td>{new Date(p.dob).toLocaleDateString()}</Td>
                <Td>{p.gender}</Td>
                <Td><Link className="underline" href={`/patients/${p._id}`}>Open</Link></Td>
              </tr>
            ))}
          </tbody>
        </T>
      </Table>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <div className="text-sm">Page {data?.page ?? page}</div>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(data?.items?.length ?? 0) < 10}>Next</Button>
      </div>
    </div>
  )
}
