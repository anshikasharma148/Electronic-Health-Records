"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { getUser } from "@/lib/auth";

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);

export default function Page() {
  const sp = useSearchParams();

  const u = getUser();
  const canBook = !!u && (u.role === "admin" || u.role === "provider");

  const [items, setItems] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    api
      .get(API.appointments.root, { params: { limit: 50 } })
      .then((r) => setItems(Array.isArray(r.data.items) ? r.data.items : []))
      .catch(() => {
        setItems([]);
        setErr("Failed to load appointments.");
      });
  }, [refresh]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canBook) return;

    setErr(null);
    const f = new FormData(e.currentTarget);
    const patient = String(f.get("patient") || "");
    const providerId = String(f.get("providerId") || "");
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    const reason = String(f.get("reason") || "");

    if (!isObjectId(patient)) return setErr("Enter a valid PatientId (24-character hex).");
    if (!providerId) return setErr("ProviderId is required.");
    if (!start || !end) return setErr("Start and End are required.");
    if (new Date(start) >= new Date(end)) return setErr("End must be after Start.");

    try {
      await api.post(API.appointments.root, { patient, providerId, start, end, reason });
      setRefresh((x) => x + 1);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (ex: any) {
      setErr(ex?.response?.data?.message || "Booking failed.");
    }
  };

  return (
    <div className="space-y-4">
      {canBook ? (
        <form className="grid sm:grid-cols-5 gap-2" onSubmit={submit}>
          <Input
            name="patient"
            placeholder="PatientId (24-hex)"
            defaultValue={sp.get("patient") ?? ""}
          />
          <Input name="providerId" placeholder="ProviderId" defaultValue="provider123" />
          <Input name="start" type="datetime-local" />
          <Input name="end" type="datetime-local" />
          <Button>Book</Button>
          <Input name="reason" placeholder="Reason (optional)" className="sm:col-span-5" />
        </form>
      ) : (
        <div className="text-sm text-amber-700">
          Read-only access for role “{u?.role ?? "unknown"}”. Booking is disabled.
        </div>
      )}

      {err && <div className="text-sm text-red-700">{err}</div>}

      <Table>
        <T>
          <thead>
            <tr>
              <Th>Patient</Th>
              <Th>Provider</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => {
              const patientName =
                typeof a.patient === "string"
                  ? a.patient
                  : a?.patient
                  ? `${a.patient.firstName ?? ""} ${a.patient.lastName ?? ""}`.trim()
                  : "Unknown";

              return (
                <tr key={a._id}>
                  <Td>{patientName || "Unknown"}</Td>
                  <Td>{a.providerId}</Td>
                  <Td>{new Date(a.start).toLocaleString()}</Td>
                  <Td>{new Date(a.end).toLocaleString()}</Td>
                  <Td>{a.status}</Td>
                </tr>
              );
            })}
          </tbody>
        </T>
      </Table>
    </div>
  );
}
