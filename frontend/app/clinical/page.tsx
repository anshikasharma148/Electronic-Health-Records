"use client";
import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { getUser } from "@/lib/auth";

type Note = { _id?: string; text: string; createdAt?: string };
type Vital = { _id?: string; when: string; hr: number; bp: string };
type Lab = { _id?: string; test: string; value: string };

export default function Page() {
  const u = getUser();
  const canEdit = !!u && (u.role === "admin" || u.role === "provider");

  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setNotes([]); setVitals([]); setLabs([]); setErr(null);
      return;
    }
    setErr(null);
    api
      .get(API.clinical.overview, { params: { patientId } })
      .then((r) => {
        const d = r.data || {};
        setNotes(Array.isArray(d.notes) ? d.notes : []);
        setVitals(Array.isArray(d.vitals) ? d.vitals : []);
        setLabs(Array.isArray(d.labs) ? d.labs : []);
      })
      .catch(() => setErr("Failed to load clinical data"));
  }, [patientId]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="PatientId"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
      />

      {!canEdit && (
        <div className="text-xs text-amber-600">
          Read-only: your role “{u?.role ?? "unknown"}” cannot add or edit clinical data.
        </div>
      )}
      {err && <div className="text-xs text-red-700">{err}</div>}

      <div className="grid md:grid-cols-3 gap-3">
        {/* Notes */}
        <section className="border rounded-xl p-3">
          <div className="text-sm font-medium mb-2">Notes</div>

          {canEdit && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget as HTMLFormElement);
                const text = String(f.get("text") || "");
                if (!patientId || !text) return;
                try {
                  await api.post("/api/clinical/notes", { patientId, text });
                  setNotes((x) => [{ text, createdAt: new Date().toISOString() }, ...x]);
                  (e.currentTarget as HTMLFormElement).reset();
                } catch {
                  setErr("Failed to add note");
                }
              }}
              className="flex gap-2 mb-2"
            >
              <Input name="text" placeholder="Text" />
              <Button>Add</Button>
            </form>
          )}

          <Table>
            <T>
              <thead>
                <tr><Th>Text</Th></tr>
              </thead>
              <tbody>
                {notes.map((n, i) => (
                  <tr key={n._id ?? `n-${i}`}><Td>{n.text}</Td></tr>
                ))}
              </tbody>
            </T>
          </Table>
        </section>

        {/* Vitals */}
        <section className="border rounded-xl p-3">
          <div className="text-sm font-medium mb-2">Vitals</div>

          {canEdit && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget as HTMLFormElement);
                const when = String(f.get("when") || "");
                const hr = Number(f.get("hr") || 0);
                const bp = String(f.get("bp") || "");
                if (!patientId || !when) return;
                try {
                  await api.post("/api/clinical/vitals", { patientId, when, hr, bp });
                  setVitals((x) => [{ when, hr, bp }, ...x]);
                  (e.currentTarget as HTMLFormElement).reset();
                } catch {
                  setErr("Failed to add vitals");
                }
              }}
              className="grid grid-cols-3 gap-2 mb-2"
            >
              <Input name="when" type="datetime-local" />
              <Input name="hr" placeholder="HR" />
              <Input name="bp" placeholder="BP" />
              <div className="col-span-3"><Button>Add</Button></div>
            </form>
          )}

          <Table>
            <T>
              <thead>
                <tr><Th>When</Th><Th>HR</Th><Th>BP</Th></tr>
              </thead>
              <tbody>
                {vitals.map((v, i) => (
                  <tr key={v._id ?? `v-${i}`}>
                    <Td>{new Date(v.when).toLocaleString()}</Td>
                    <Td>{v.hr}</Td>
                    <Td>{v.bp}</Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </section>

        {/* Labs */}
        <section className="border rounded-xl p-3">
          <div className="text-sm font-medium mb-2">Labs</div>

          {canEdit && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget as HTMLFormElement);
                const test = String(f.get("test") || "");
                const value = String(f.get("value") || "");
                if (!patientId || !test) return;
                try {
                  await api.post("/api/clinical/labs", { patientId, test, value });
                  setLabs((x) => [{ test, value }, ...x]);
                  (e.currentTarget as HTMLFormElement).reset();
                } catch {
                  setErr("Failed to add lab");
                }
              }}
              className="grid grid-cols-2 gap-2 mb-2"
            >
              <Input name="test" placeholder="Test" />
              <Input name="value" placeholder="Value" />
              <div className="col-span-2"><Button>Add</Button></div>
            </form>
          )}

          <Table>
            <T>
              <thead>
                <tr><Th>Test</Th><Th>Value</Th></tr>
              </thead>
              <tbody>
                {labs.map((l, i) => (
                  <tr key={l._id ?? `l-${i}`}><Td>{l.test}</Td><Td>{l.value}</Td></tr>
                ))}
              </tbody>
            </T>
          </Table>
        </section>
      </div>
    </div>
  );
}
