import { ClinicalNote, Vital, LabResult } from "../models/Clinical";
import Patient from "../models/Patient";

export const getOverview = async (patientId: string) => {
  const [notes, vitals, labs] = await Promise.all([
    ClinicalNote.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20),
    Vital.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20),
    LabResult.find({ patient: patientId }).sort({ createdAt: -1 }).limit(20)
  ]);
  return { notes, vitals, labs };
};

export const addNote = async (payload: any) => {
  return ClinicalNote.create(payload);
};

export const recordVitals = async (payload: any) => {
  return Vital.create({
    ...payload,
    recordedAt: payload.recordedAt || new Date()
  });
};

export const listLabs = async (patientId: string) => {
  return LabResult.find({ patient: patientId }).sort({ createdAt: -1 });
};

export const addDiagnosis = async (
  patientId: string,
  diagnoses: { code: string; description: string; type?: "diagnosis" | "procedure" }[]
) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw Object.assign(new Error("patient_not_found"), { status: 404 });

  const existing = patient.diagnoses || [];
  const merged = [...existing];

  diagnoses.forEach(d => {
    if (!merged.some(m => m.code === d.code)) {
      merged.push(d);
    }
  });

  patient.diagnoses = merged;
  await patient.save();

  return patient;
};

/* === additions below === */
import Appointment from "../models/Appointment";
import Encounter from "../models/Encounter";

export const updateVital = async (id: string, payload: any) => {
  return Vital.findByIdAndUpdate(id, payload, { new: true });
};

export const addLab = async (payload: any) => {
  const data = { ...payload, takenAt: payload.takenAt || new Date() };
  return LabResult.create(data);
};

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
    Encounter.find({ patient: patientId }).sort({ start: -1 }).limit(limit)
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
