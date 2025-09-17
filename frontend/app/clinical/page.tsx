"use client";
import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { getUser } from "@/lib/auth";
import useToast from "@/hooks/useToast";
import {
  UserIcon,
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from "@heroicons/react/24/outline";

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
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <UserIcon className="w-8 h-8 text-blue-500" />
          Clinical Overview
        </h1>
        
        {/* Patient selector */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Enter Patient ID (24-character hex)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {readOnly ? (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm">
              <EyeIcon className="w-5 h-5" />
              <span>Read-only: your role "{u?.role ?? "unknown"}" cannot add or edit clinical data.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg text-sm">
              <PencilIcon className="w-5 h-5" />
              <span>Provider/Admin can add Notes, Vitals, and Labs below.</span>
            </div>
          )}
          
          {loadErr && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              {loadErr}
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Authoring (only admin/provider) */}
      {!readOnly && isObjectId(patientId) && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Add Note */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Add Note</h2>
            </div>
            <form className="space-y-3" onSubmit={addNote}>
              <textarea
                placeholder="Enter note text..."
                value={nText}
                onChange={(e) => setNText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
              />
              <Button disabled={!canAddNote} className="flex items-center gap-2 w-full justify-center">
                <PlusIcon className="w-4 h-4" />
                Add Note
              </Button>
            </form>
          </div>

          {/* Record Vitals */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <HeartIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Record Vitals</h2>
            </div>
            <form className="space-y-3" onSubmit={addVital}>
              <div className="relative">
                <Input
                  type="datetime-local"
                  value={vWhen}
                  onChange={(e) => setVWhen(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
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
              <Button disabled={!canAddVital} className="flex items-center gap-2 w-full justify-center">
                <PlusIcon className="w-4 h-4" />
                Record Vitals
              </Button>
            </form>
          </div>

          {/* Add Lab */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <BeakerIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Add Lab Result</h2>
            </div>
            <form className="space-y-3" onSubmit={addLab}>
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
              <Button disabled={!canAddLab} className="flex items-center gap-2 w-full justify-center">
                <PlusIcon className="w-4 h-4" />
                Add Lab Result
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Read-only lists */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
            <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {notes.length}
            </span>
          </div>
          
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No notes found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.map((n) => (
                <div key={n._id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-2">{n.text}</p>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vitals */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <HeartIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Vitals</h2>
            <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {vitals.length}
            </span>
          </div>
          
          {vitals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HeartIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No vitals recorded</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vitals.map((v) => (
                <div key={v._id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(v.when).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Heart Rate</div>
                      <div className="text-sm font-medium">{v.hr} bpm</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Blood Pressure</div>
                      <div className="text-sm font-medium">{v.bp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labs */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <BeakerIcon className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Labs</h2>
            <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {labs.length}
            </span>
          </div>
          
          {labs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BeakerIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No lab results</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {labs.map((l) => (
                <div key={l._id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-800 mb-1">{l.test}</div>
                  <div className="text-sm text-gray-700">{l.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
}

// Custom ExclamationTriangleIcon component
const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);