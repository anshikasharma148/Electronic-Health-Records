"use client";
import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { getUser } from "@/lib/auth";
import useToast from "@/hooks/useToast";

type Note = { _id: string; text: string; createdAt?: string };
type Vital = { _id: string; when: string; hr: number; bp: string };
type Lab = { _id: string; test: string; value: string };

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export default function Page() {
  const { show, Toast } = useToast();

  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const u = getUser();
  const readOnly = !u || (u.role !== "admin" && u.role !== "provider");

  // ---- Load overview (notes/vitals/labs) ----
  const loadOverview = async (pid: string) => {
    if (!isObjectId(pid)) {
      setNotes([]);
      setVitals([]);
      setLabs([]);
      if (pid) setLoadErr("Enter a valid PatientId (24-character hex).");
      else setLoadErr(null);
      return;
    }
    try {
      setLoadErr(null);
      const r = await api.get(API.clinical.overview, { params: { patientId: pid } });
      const d = r.data || {};
      setNotes(Array.isArray(d.notes) ? d.notes : []);
      setVitals(Array.isArray(d.vitals) ? d.vitals : []);
      setLabs(Array.isArray(d.labs) ? d.labs : []);
    } catch (e: any) {
      setNotes([]);
      setVitals([]);
      setLabs([]);
      setLoadErr(e?.response?.data?.message || "Failed to load clinical data.");
    }
  };

  useEffect(() => {
    if (!patientId) {
      setNotes([]); setVitals([]); setLabs([]); setLoadErr(null);
      return;
    }
    loadOverview(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, refresh]);

  // ===========================
  // Create: Notes / Vitals / Labs (admin|provider)
  // ===========================
  // Note form
  const [nText, setNText] = useState("");
  const canAddNote = useMemo(
    () => !readOnly && isObjectId(patientId) && nText.trim().length > 0,
    [readOnly, patientId, nText]
  );
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddNote) return;
    try {
      await api.post(API.clinical.notes, { patientId, text: nText.trim() });
      show("📝 Note added");
      setNText("");
      setRefresh((x) => x + 1);
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Failed to add note."}`);
    }
  };

  // Vital form
  const [vWhen, setVWhen] = useState(""); // datetime-local
  const [vHr, setVHr] = useState<string>("");
  const [vBp, setVBp] = useState("");
  const canAddVital = useMemo(
    () =>
      !readOnly &&
      isObjectId(patientId) &&
      !!vWhen &&
      vHr !== "" &&
      !Number.isNaN(Number(vHr)) &&
      vBp.trim().length > 0,
    [readOnly, patientId, vWhen, vHr, vBp]
  );
  const addVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddVital) return;
    try {
      await api.post(API.clinical.vitals, {
        patientId,
        when: new Date(vWhen).toISOString(),
        hr: Number(vHr),
        bp: vBp.trim(),
      });
      show("❤️ Vitals recorded");
      setVWhen("");
      setVHr("");
      setVBp("");
      setRefresh((x) => x + 1);
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Failed to record vitals."}`);
    }
  };

  // Lab form
  const [lTest, setLTest] = useState("");
  const [lValue, setLValue] = useState("");
  const canAddLab = useMemo(
    () => !readOnly && isObjectId(patientId) && lTest.trim() && lValue.trim(),
    [readOnly, patientId, lTest, lValue]
  );
  const addLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddLab) return;
    try {
      await api.post(API.clinical.labs, {
        patientId,
        test: lTest.trim(),
        value: lValue.trim(),
      });
      show("🧪 Lab result added");
      setLTest("");
      setLValue("");
      setRefresh((x) => x + 1);
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Failed to add lab result."}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Patient selector */}
      <div className="space-y-2">
        <Input
          placeholder="PatientId (24-hex)"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        />
        {readOnly ? (
          <div className="text-xs text-amber-600">
            Read-only: your role “{u?.role ?? "unknown"}” cannot add or edit clinical data.
          </div>
        ) : (
          <div className="text-xs text-neutral-500">
            Provider/Admin can add Notes, Vitals, and Labs below.
          </div>
        )}
        {loadErr && <div className="text-sm text-red-700">{loadErr}</div>}
      </div>

      {/* Authoring (only admin/provider) */}
      {!readOnly && isObjectId(patientId) && (
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Add Note */}
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium mb-2">Add Note</div>
            <form className="space-y-2" onSubmit={addNote}>
              <Input
                placeholder="Note text"
                value={nText}
                onChange={(e) => setNText(e.target.value)}
              />
              <Button disabled={!canAddNote}>Save</Button>
            </form>
          </div>

          {/* Record Vitals */}
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium mb-2">Record Vitals</div>
            <form className="grid sm:grid-cols-3 gap-2" onSubmit={addVital}>
              <Input
                type="datetime-local"
                value={vWhen}
                onChange={(e) => setVWhen(e.target.value)}
              />
              <Input
                placeholder="HR (bpm)"
                value={vHr}
                onChange={(e) => setVHr(e.target.value)}
              />
              <Input
                placeholder="BP (e.g. 120/80)"
                value={vBp}
                onChange={(e) => setVBp(e.target.value)}
              />
              <div className="sm:col-span-3">
                <Button disabled={!canAddVital}>Save</Button>
              </div>
            </form>
          </div>

          {/* Add Lab */}
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium mb-2">Add Lab Result</div>
            <form className="grid sm:grid-cols-2 gap-2" onSubmit={addLab}>
              <Input
                placeholder="Test (e.g. CBC, HbA1c)"
                value={lTest}
                onChange={(e) => setLTest(e.target.value)}
              />
              <Input
                placeholder="Value (e.g. 6.2%)"
                value={lValue}
                onChange={(e) => setLValue(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Button disabled={!canAddLab}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read-only lists */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded-xl p-2">
          <div className="text-sm font-medium mb-2">Notes</div>
          <Table>
            <T>
              <thead>
                <tr><Th>Text</Th><Th>Created</Th></tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n._id}>
                    <Td>{n.text}</Td>
                    <Td>{n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </div>

        <div className="border rounded-xl p-2">
          <div className="text-sm font-medium mb-2">Vitals</div>
          <Table>
            <T>
              <thead>
                <tr><Th>When</Th><Th>HR</Th><Th>BP</Th></tr>
              </thead>
              <tbody>
                {vitals.map((v) => (
                  <tr key={v._id}>
                    <Td>{new Date(v.when).toLocaleString()}</Td>
                    <Td>{v.hr}</Td>
                    <Td>{v.bp}</Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </div>

        <div className="border rounded-xl p-2">
          <div className="text-sm font-medium mb-2">Labs</div>
          <Table>
            <T>
              <thead>
                <tr><Th>Test</Th><Th>Value</Th></tr>
              </thead>
              <tbody>
                {labs.map((l) => (
                  <tr key={l._id}>
                    <Td>{l.test}</Td>
                    <Td>{l.value}</Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </div>
      </div>

      <Toast />
    </div>
  );
}
