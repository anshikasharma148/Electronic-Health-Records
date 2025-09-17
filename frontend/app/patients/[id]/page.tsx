"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Patient } from "@/types/api";
import { getUser } from "@/lib/auth";
import {
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

// Additional simple SVG icons
const PillIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.32.19 2.57.495 3.75.914M6.75 4.97c1.32.19 2.57.495 3.75.914M12 3a75 75 0 00-9.375 12.436m0 0A75 75 0 0112 20.25c2.63 0 5.159-.491 7.538-1.37M12 3a75 75 0 019.375 12.436M21 12a75 75 0 01-9.375 12.436" />
  </svg>
);

const SyringeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6m6-6v12m6-6a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// helpers
const splitList = (v: FormDataEntryValue | null | string) =>
  String(v ?? "")
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !/^n\/?a$|^na$|^none$|^no$/i.test(s));

const parsePair = (item: string) =>
  item.split("|").map(p => p.trim()).filter(Boolean);

const toDateInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

type UINote = { _id: string; text: string; createdAt?: string; authorId?: string };
type UIVital = {
  _id: string;
  recordedAt?: string; when?: string; createdAt?: string;
  hr?: number; heartRate?: number;
  bp?: string; bpSystolic?: number; bpDiastolic?: number;
  temperature?: number;
};
type UILab = {
  _id: string;
  test?: string; testName?: string; testCode?: string;
  value?: string; unit?: string;
  takenAt?: string; createdAt?: string;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const u = getUser();
  const canEdit = !!u && (u.role === "admin" || u.role === "provider");

  // ---- Clinical snapshot state ----
  const [notes, setNotes] = useState<UINote[]>([]);
  const [vitals, setVitals] = useState<UIVital[]>([]);
  const [labs, setLabs] = useState<UILab[]>([]);
  const [cErr, setCErr] = useState<string | null>(null);
  const [cLoading, setCLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get(API.patients.one(id)).then(r => setPatient(r.data));
  }, [id]);

  // load clinical overview for this patient
  const loadOverview = async () => {
    if (!id) return;
    try {
      setCLoading(true);
      setCErr(null);
      const r = await api.get(API.clinical.overview, { params: { patientId: id } });
      const d = r.data || {};
      setNotes(Array.isArray(d.notes) ? d.notes : []);
      setVitals(Array.isArray(d.vitals) ? d.vitals : []);
      setLabs(Array.isArray(d.labs) ? d.labs : []);
    } catch (e: any) {
      setCErr(e?.response?.data?.message || "Failed to load clinical data.");
      setNotes([]); setVitals([]); setLabs([]);
    } finally {
      setCLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  // Pre-fill textareas (canonical "CODE|Description" style where applicable)
  const prefill = useMemo(() => {
    if (!patient) return {
      allergies: "", conditions: "", medications: "", immunizations: "", diagnoses: ""
    };

    const allergies = (patient.allergies || [])
      .map(a => a.code ? `${a.code}|${a.description || ""}`.trim() : `${a.description || ""}`)
      .join("\n");

    const conditions = (patient.conditions || [])
      .map(c => c.code ? `${c.code}|${c.description || ""}`.trim() : `${c.description || ""}`)
      .join("\n");

    const medications = (patient.medications || [])
      .map(m => {
        if (m.code || m.dosage) return [m.code, m.name, m.dosage].filter(Boolean).join("|");
        return m.name || "";
      })
      .join("\n");

    const immunizations = (patient.immunizations || [])
      .map(i => i.code ? `${i.code}|${i.name || ""}`.trim() : `${i.name || ""}`)
      .join("\n");

    const diagnoses = (patient.diagnoses || [])
      .map(d => [d.code, d.description].filter(Boolean).join("|"))
      .join("\n");

    return { allergies, conditions, medications, immunizations, diagnoses };
  }, [patient]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    setErr(null);
    setSuccess(false);

    const f = new FormData(e.currentTarget);

    // Always allow contact edits
    const contact = {
      phone: String(f.get("phone") || ""),
      email: String(f.get("email") || ""),
      address: String(f.get("address") || "")
    };

    // Build payload
    let payload: any = { contact };

    // Demographics (admins/providers only)
    if (canEdit) {
      payload.firstName = String(f.get("firstName") || patient.firstName || "").trim();
      payload.lastName  = String(f.get("lastName")  || patient.lastName  || "").trim();
      payload.gender    = String(f.get("gender")    || patient.gender    || "").trim().toLowerCase();

      const dobStr = String(f.get("dob") || "");
      if (dobStr) payload.dob = new Date(dobStr).toISOString();

      // Clinical arrays
      const allergies = splitList(f.get("allergies")).map(item => {
        const [a, b] = parsePair(item);
        return { code: (a || item).toUpperCase(), description: b ?? item };
      });

      const conditions = splitList(f.get("conditions")).map(item => {
        const [a, b] = parsePair(item);
        return { code: (a || item).toUpperCase(), description: b ?? item };
      });

      const medications = splitList(f.get("medications")).map(item => {
        const [code, name, dosage] = parsePair(item);
        return name
          ? { code, name, dosage }
          : { name: code || item };
      });

      const immunizations = splitList(f.get("immunizations")).map(item => {
        const [code, name] = parsePair(item);
        return name
          ? { code, name }
          : { name: code || item };
      });

      const diagnoses = splitList(f.get("diagnoses")).map(item => {
        const [codeMaybe, descMaybe] = parsePair(item);
        const code = (codeMaybe || item).toUpperCase();
        const description = descMaybe || item;
        return { code, description, type: "diagnosis" as const };
      });

      payload = { ...payload, allergies, conditions, medications, immunizations, diagnoses };
    }

    try {
      const { data } = await api.put(API.patients.one(id), payload);
      setPatient(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Quick add forms (notes / vitals / labs) ----
  const [nText, setNText] = useState("");
  const [nMsg, setNMsg] = useState<string | null>(null);
  const canAddNote = useMemo(() => canEdit && id && nText.trim().length > 0, [canEdit, id, nText]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddNote) return;
    setNMsg(null);
    try {
      await api.post(API.clinical.notes, { patientId: id, text: nText.trim() });
      setNText("");
      setNMsg("📝 Note added");
      setRefreshKey(k => k + 1);
      setTimeout(() => setNMsg(null), 2000);
    } catch (ex: any) {
      setNMsg(ex?.response?.data?.message || "Failed to add note.");
    }
  };

  const [vWhen, setVWhen] = useState("");
  const [vHr, setVHr] = useState<string>("");
  const [vBp, setVBp] = useState("");
  const [vMsg, setVMsg] = useState<string | null>(null);
  const canAddVital = useMemo(
    () =>
      canEdit && id && !!vWhen && vHr !== "" && !Number.isNaN(Number(vHr)) && vBp.trim().length > 0,
    [canEdit, id, vWhen, vHr, vBp]
  );

  const addVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddVital) return;
    setVMsg(null);
    try {
      await api.post(API.clinical.vitals, {
        patientId: id,
        when: new Date(vWhen).toISOString(),
        hr: Number(vHr),
        bp: vBp.trim(),
      });
      setVWhen(""); setVHr(""); setVBp("");
      setVMsg("❤️ Vitals recorded");
      setRefreshKey(k => k + 1);
      setTimeout(() => setVMsg(null), 2000);
    } catch (ex: any) {
      setVMsg(ex?.response?.data?.message || "Failed to record vitals.");
    }
  };

  const [lTest, setLTest] = useState("");
  const [lValue, setLValue] = useState("");
  const [lMsg, setLMsg] = useState<string | null>(null);
  const canAddLab = useMemo(
    () => canEdit && id && lTest.trim().length > 0 && lValue.trim().length > 0,
    [canEdit, id, lTest, lValue]
  );

  const addLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddLab) return;
    setLMsg(null);
    try {
      await api.post(API.clinical.labs, { patientId: id, test: lTest.trim(), value: lValue.trim() });
      setLTest(""); setLValue("");
      setLMsg("🧪 Lab result added");
      setRefreshKey(k => k + 1);
      setTimeout(() => setLMsg(null), 2000);
    } catch (ex: any) {
      setLMsg(ex?.response?.data?.message || "Failed to add lab result.");
    }
  };

  if (!patient) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse text-gray-500">Loading patient data...</div>
    </div>
  );

  // helpers to render clinical data in tolerant way (supports both hr/bp and heartRate/bpSystolic/bpDiastolic shapes)
  const vitalDate = (v: UIVital) => v.recordedAt || v.when || v.createdAt || "";
  const vitalHR = (v: UIVital) => (v.hr ?? v.heartRate);
  const vitalBP = (v: UIVital) => v.bp || ((v.bpSystolic != null && v.bpDiastolic != null) ? `${v.bpSystolic}/${v.bpDiastolic}` : undefined);

  const labWhen = (l: UILab) => l.takenAt || l.createdAt || "";
  const labTest = (l: UILab) => l.test || l.testName || l.testCode || "Lab";
  const labValue = (l: UILab) => [l.value, l.unit].filter(Boolean).join(" ");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserIcon className="w-8 h-8 text-blue-500" />
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <CalendarIcon className="w-5 h-5" />
              <span>{new Date(patient.dob).toLocaleDateString()}</span>
              <span className="mx-1">•</span>
              <span className="capitalize">{patient.gender}</span>
            </div>
            <div className="text-xs text-gray-500 mt-3 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
              ID: {patient._id}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            {canEdit ? (
              <>
                <PencilIcon className="w-4 h-4" />
                <span>Edit Mode</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                <span>View Mode</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {err && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          {err}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-2 animate-fade-in">
          <CheckCircleIcon className="w-5 h-5" />
          Patient information updated successfully!
        </div>
      )}

      <form className="space-y-6" onSubmit={submit}>
        {/* Demographics (admin/provider editable) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            Demographics
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">First name</label>
              <Input
                name="firstName"
                placeholder="First name"
                defaultValue={patient.firstName}
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Last name</label>
              <Input
                name="lastName"
                placeholder="Last name"
                defaultValue={patient.lastName}
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">DOB</label>
              <Input
                name="dob"
                type="date"
                defaultValue={toDateInput(patient.dob)}
                disabled={!canEdit}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                defaultValue={String(patient.gender || "unknown")}
                disabled={!canEdit}
                className="w-full border border-gray-200 rounded-xl p-2.5 bg-white"
              >
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
                <option value="unknown">unknown</option>
              </select>
            </div>
          </div>

          {!canEdit && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded">
              You don’t have permission to edit demographics.
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-blue-600" />
            </div>
            Contact Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="phone"
                  placeholder="Phone"
                  defaultValue={patient.contact?.phone || ""}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="email"
                  placeholder="Email"
                  defaultValue={patient.contact?.email || ""}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  name="address"
                  placeholder="Address"
                  defaultValue={patient.contact?.address || ""}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical sections (structured fields) */}
        {canEdit ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Clinical Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ClinicalSection
                icon={<ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />}
                title="Allergies"
                name="allergies"
                defaultValue={prefill.allergies}
                hint="One per line. CODE|Description or just Description"
              />

              <ClinicalSection
                icon={<HeartIcon className="w-5 h-5 text-red-500" />}
                title="Conditions"
                name="conditions"
                defaultValue={prefill.conditions}
                hint="ICD10|Description or just Description"
              />

              <ClinicalSection
                icon={<PillIcon className="w-5 h-5 text-indigo-500" />}
                title="Medications"
                name="medications"
                defaultValue={prefill.medications}
                hint="CODE|Name|Dosage or just Name"
              />

              <ClinicalSection
                icon={<SyringeIcon className="w-5 h-5 text-green-500" />}
                title="Immunizations"
                name="immunizations"
                defaultValue={prefill.immunizations}
                hint="CODE|Name or just Name"
              />

              <div className="md:col-span-2">
                <ClinicalSection
                  icon={<DocumentTextIcon className="w-5 h-5 text-purple-500" />}
                  title="Diagnoses"
                  name="diagnoses"
                  defaultValue={prefill.diagnoses}
                  hint="CODE|Description (if only one value is provided, it will be used as both code and description)"
                  fullWidth
                />
              </div>
            </div>
          </div>
        ) : (
          // Read-only view for viewer/billing
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Clinical Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ReadonlyList
                title="Allergies"
                icon={<ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />}
                items={(patient.allergies || []).map(a => a.description || a.code)}
              />
              <ReadonlyList
                title="Conditions"
                icon={<HeartIcon className="w-5 h-5 text-red-500" />}
                items={(patient.conditions || []).map(c => c.description || c.code)}
              />
              <ReadonlyList
                title="Medications"
                icon={<PillIcon className="w-5 h-5 text-indigo-500" />}
                items={(patient.medications || []).map(m => [m.name, m.dosage].filter(Boolean).join(" • "))}
              />
              <ReadonlyList
                title="Immunizations"
                icon={<SyringeIcon className="w-5 h-5 text-green-500" />}
                items={(patient.immunizations || []).map(i => i.name || i.code)}
              />
              <ReadonlyList
                title="Diagnoses"
                icon={<DocumentTextIcon className="w-5 h-5 text-purple-500" />}
                items={(patient.diagnoses || []).map(d => [d.code, d.description].filter(Boolean).join(" — "))}
                fullWidth
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button disabled={saving} className="flex items-center gap-2 transition-all hover:gap-3">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* =============================== */}
      {/* Clinical Snapshot + Quick Entry */}
      {/* =============================== */}
      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Clinical Snapshot</h2>
            <Button variant="outline" onClick={loadOverview} disabled={cLoading}>
              {cLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {cErr && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {cErr}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="font-medium text-gray-800">Notes</div>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{notes.length}</span>
              </div>
              {notes.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No notes found</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notes.map((n) => (
                    <div key={n._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="text-sm text-gray-800">{n.text}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vitals */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <HeartIcon className="w-5 h-5 text-red-600" />
                </div>
                <div className="font-medium text-gray-800">Vitals</div>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vitals.length}</span>
              </div>
              {vitals.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No vitals recorded</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {vitals.map((v) => (
                    <div key={v._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="text-[11px] text-gray-500">
                        {vitalDate(v) ? new Date(vitalDate(v)!).toLocaleString() : "-"}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                        <div>HR: <span className="font-medium">{vitalHR(v) ?? "-"}</span></div>
                        <div>BP: <span className="font-medium">{vitalBP(v) ?? "-"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labs */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <SyringeIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="font-medium text-gray-800">Labs</div>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{labs.length}</span>
              </div>
              {labs.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No lab results</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {labs.map((l) => (
                    <div key={l._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-800">{labTest(l)}</div>
                      <div className="text-sm text-gray-700">{labValue(l) || "-"}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{labWhen(l) ? new Date(labWhen(l)!).toLocaleString() : "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Entry (admin/provider) */}
        {canEdit && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Entry</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Add Note */}
              <form onSubmit={addNote} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-medium">Add Note</div>
                </div>
                <textarea
                  placeholder="Enter note text..."
                  value={nText}
                  onChange={(e) => setNText(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[88px]"
                />
                <Button disabled={!canAddNote} className="w-full">Save Note</Button>
                {nMsg && <div className="text-xs text-gray-600">{nMsg}</div>}
              </form>

              {/* Record Vitals */}
              <form onSubmit={addVital} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <HeartIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="font-medium">Record Vitals</div>
                </div>
                <Input
                  type="datetime-local"
                  value={vWhen}
                  onChange={(e) => setVWhen(e.target.value)}
                />
                <Input
                  placeholder="Heart Rate (bpm)"
                  value={vHr}
                  onChange={(e) => setVHr(e.target.value)}
                  type="number"
                />
                <Input
                  placeholder="Blood Pressure (e.g. 120/80)"
                  value={vBp}
                  onChange={(e) => setVBp(e.target.value)}
                />
                <Button disabled={!canAddVital} className="w-full">Save Vitals</Button>
                {vMsg && <div className="text-xs text-gray-600">{vMsg}</div>}
              </form>

              {/* Add Lab */}
              <form onSubmit={addLab} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <SyringeIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="font-medium">Add Lab</div>
                </div>
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
                <Button disabled={!canAddLab} className="w-full">Save Lab</Button>
                {lMsg && <div className="text-xs text-gray-600">{lMsg}</div>}
              </form>
            </div>
          </div>
        )}
      </div>
      {/* /Clinical Snapshot + Quick Entry */}
    </div>
  );
}

// Clinical section component
interface ClinicalSectionProps {
  icon: React.ReactNode;
  title: string;
  name: string;
  defaultValue: string;
  hint: string;
  fullWidth?: boolean;
}
function ClinicalSection({ icon, title, name, defaultValue, hint, fullWidth = false }: ClinicalSectionProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <label className="text-sm font-medium text-gray-700">{title}</label>
      </div>
      <div className="text-xs text-gray-500 mb-2 pl-8">{hint}</div>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        rows={4}
      />
    </div>
  );
}

// Read-only list component
interface ReadonlyListProps {
  title: string;
  icon: React.ReactNode;
  items: (string | undefined)[];
  fullWidth?: boolean;
}
function ReadonlyList({ title, icon, items, fullWidth = false }: ReadonlyListProps) {
  const clean = (items || []).map(s => (s || "").trim()).filter(Boolean);
  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${fullWidth ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
      </div>
      {clean.length === 0 ? (
        <div className="text-xs text-gray-500 italic pl-8">No records</div>
      ) : (
        <ul className="space-y-2 pl-8">
          {clean.map((s, i) => (
            <li key={i} className="text-sm text-gray-600 relative pl-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-400 before:rounded-full before:absolute before:left-0 before:top-2">
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
