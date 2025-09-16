"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { Paginated, Patient } from "@/types/api";
import { getUser } from "@/lib/auth";

export default function Page() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Patient> | null>(null);

  const u = getUser();
  const canCreate = !!u && (u.role === "admin" || u.role === "provider");

  useEffect(() => {
    api
      .get(API.patients.root, { params: { q, page, limit: 10 } })
      .then((r) => setData(r.data))
      .catch(() => setData({ items: [], page: 1, total: 0 } as any));
  }, [q, page]);

  const onUnauthorizedNew = () => {
    alert(
      `You don't have permission to create patients.\n\nYour role: ${u?.role ?? "unknown"}\nAllowed roles: admin, provider`
    );
  };

  const copy = (s: string) => navigator.clipboard?.writeText(s);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search name/phone/email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button onClick={() => setPage(1)}>Search</Button>

        {canCreate ? (
          <Link
            href="/patients/new"
            className="px-3 py-2 rounded-lg bg-neutral-900 text-white"
          >
            New
          </Link>
        ) : (
          <button
            onClick={onUnauthorizedNew}
            className="px-3 py-2 rounded-lg bg-neutral-300 text-neutral-700 cursor-not-allowed"
            title="Only Admin/Provider can create patients"
          >
            New
          </button>
        )}
      </div>

      {!canCreate && (
        <div className="text-xs text-amber-600">
          Read-only access for role “{u?.role}”. Creating patients is disabled.
        </div>
      )}

      <Table>
        <T>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Name</Th>
              <Th>DOB</Th>
              <Th>Gender</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((p) => (
              <tr key={p._id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{p._id}</span>
                    <button
                      type="button"
                      className="text-xs border rounded px-2 py-0.5"
                      title="Copy Patient ID"
                      onClick={() => copy(p._id)}
                    >
                      Copy
                    </button>
                  </div>
                </Td>
                <Td>{p.firstName} {p.lastName}</Td>
                <Td>{new Date(p.dob).toLocaleDateString()}</Td>
                <Td>{p.gender}</Td>
                <Td className="space-x-3">
                  <Link className="underline" href={`/patients/${p._id}`}>Open</Link>
                  <Link className="underline" href={`/appointments?patient=${p._id}`}>Book</Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </T>
      </Table>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </Button>
        <div className="text-sm">Page {data?.page ?? page}</div>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={(data?.items?.length ?? 0) < 10}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
