import { ClinicalNote, Vital, LabResult } from "../models/Clinical";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import Encounter from "../models/Encounter";

/* ---------- helpers ---------- */
const parseBp = (bp: string): { sys?: number; dia?: number } => {
  const m = String(bp || "").match(/(\d+)\D+(\d+)/);
  if (!m) return {};
  return { sys: Number(m[1]), dia: Number(m[2]) };
};

/* ---------- Overview: normalize to UI-friendly shape ---------- */
export const getOverview = async (patientId: string) => {
  const [notes, vitals, labs] = await Promise.all([
    ClinicalNote.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20).lean(),
    Vital.find({ patient: patientId }).sort({ recordedAt: -1 }).limit(20).lean(),
    LabResult.find({ patient: patientId }).sort({ takenAt: -1 }).limit(20).lean(),
  ]);

  const notesOut = (notes || []).map((n: any) => ({
    _id: n._id,
    text: n.text,
    createdAt: n.createdAt,
  }));

  const vitalsOut = (vitals || []).map((v: any) => ({
    _id: v._id,
    when: v.recordedAt,
    hr: v.heartRate,
    bp:
      v.bpSystolic != null && v.bpDiastolic != null
        ? `${v.bpSystolic}/${v.bpDiastolic}`
        : "",
  }));

  const labsOut = (labs || []).map((l: any) => ({
    _id: l._id,
    test: l.testName || l.testCode,
    value: l.value,
  }));

  return { notes: notesOut, vitals: vitalsOut, labs: labsOut };
};

/* ---------- Create note (map to schema) ---------- */
export const addNote = async (payload: {
  patientId: string;
  text: string;
  createdAt?: Date;
  authorId?: string;
}) => {
  const doc = await ClinicalNote.create({
    patient: payload.patientId,
    authorId: payload.authorId || "system",
    text: payload.text,
    ...(payload.createdAt ? { createdAt: payload.createdAt } : {}),
  });
  return doc;
};

/* ---------- Record vitals (map to schema) ---------- */
export const recordVitals = async (payload: {
  patientId: string;
  recordedAt: Date;
  hr: number;
  bp: string;
}) => {
  const { sys, dia } = parseBp(payload.bp);
  const doc = await Vital.create({
    patient: payload.patientId,
    recordedAt: payload.recordedAt || new Date(),
    heartRate: payload.hr,
    bpSystolic: sys,
    bpDiastolic: dia,
  });
  return doc;
};

/* ---------- Vitals patch (UI fields -> schema fields) ---------- */
export const updateVital = async (id: string, patchUi: any) => {
  const patch: any = {};
  if (patchUi.hr != null && !Number.isNaN(Number(patchUi.hr))) patch.heartRate = Number(patchUi.hr);
  if (typeof patchUi.bp === "string") {
    const { sys, dia } = parseBp(patchUi.bp);
    if (sys != null) patch.bpSystolic = sys;
    if (dia != null) patch.bpDiastolic = dia;
  }
  if (patchUi.recordedAt || patchUi.when) {
    const d = new Date(patchUi.recordedAt ?? patchUi.when);
    if (!isNaN(d.getTime())) patch.recordedAt = d;
  }
  return Vital.findByIdAndUpdate(id, patch, { new: true });
};

/* ---------- Labs (map test/value to schema) ---------- */
export const listLabs = async (patientId: string) => {
  const labs = await LabResult.find({ patient: patientId }).sort({ takenAt: -1 }).lean();
  return (labs || []).map((l: any) => ({
    _id: l._id,
    test: l.testName || l.testCode,
    value: l.value,
  }));
};

export const addLab = async (payload: {
  patientId: string;
  test: string;
  value: string;
  createdAt?: Date;
}) => {
  const testName = String(payload.test || "");
  const testCode =
    testName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16) || "LAB";
  const doc = await LabResult.create({
    patient: payload.patientId,
    testName,
    testCode,
    value: String(payload.value),
    takenAt: payload.createdAt || new Date(),
  });
  return doc;
};

/* ---------- Diagnoses unchanged ---------- */
export const addDiagnosis = async (
  patientId: string,
  diagnoses: { code: string; description: string; type?: "diagnosis" | "procedure" }[]
) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw Object.assign(new Error("patient_not_found"), { status: 404 });

  const existing = patient.diagnoses || [];
  const merged = [...existing];

  diagnoses.forEach((d) => {
    if (!merged.some((m) => m.code === d.code)) merged.push(d);
  });

  patient.diagnoses = merged;
  await patient.save();
  return patient;
};

/* ---------- Encounters & history (unchanged) ---------- */
export const addEncounter = async (payload: any) => {
  return Encounter.create(payload);
};

export const listEncounters = async (patientId: string) => {
  return Encounter.find({ patient: patientId }).sort({ start: -1 });
};

export const getHistory = async (patientId: string, limit = 50) => {
  const [notes, vitals, labs, appts, encs] = await Promise.all([
    ClinicalNote.find({ patient: patientId }).sort({ createdAt: -1 }).limit(limit),
    Vital.find({ patient: patientId }).sort({ recordedAt: -1 }).limit(limit),
    LabResult.find({ patient: patientId }).sort({ takenAt: -1 }).limit(limit),
    Appointment.find({ patient: patientId }).sort({ start: -1 }).limit(limit),
    Encounter.find({ patient: patientId }).sort({ start: -1 }).limit(limit),
  ]);

  const rows: { type: string; date: Date; data: any }[] = [];
  for (const n of notes) rows.push({ type: "note", date: n.createdAt as any, data: n });
  for (const v of vitals) rows.push({ type: "vital", date: v.recordedAt as any, data: v });
  for (const l of labs) rows.push({ type: "lab", date: l.takenAt as any, data: l });
  for (const a of appts) rows.push({ type: "appointment", date: a.start as any, data: a });
  for (const e of encs) rows.push({ type: "encounter", date: e.start as any, data: e });

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  return rows.slice(0, limit);
};
