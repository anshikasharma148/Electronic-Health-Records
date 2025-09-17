import Patient, { PatientDoc } from "../models/Patient";
import { isValidObjectId } from "mongoose";

const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return isValidDate(d) ? d : undefined;
};
const isValidDate = (d: Date) => !isNaN(d.getTime());

export const searchPatients = async (q: string, opts: any) => {
  const page = Math.max(1, Number(opts.page || 1));
  const limit = Math.min(100, Math.max(1, Number(opts.limit || 20)));
  const skip = (page - 1) * limit;

  let query: any = {};
  if (q && q.trim()) {
    const trimmed = q.trim();
    const or: any[] = [
      { firstName: { $regex: trimmed, $options: "i" } },
      { lastName: { $regex: trimmed, $options: "i" } },
      { "contact.phone": { $regex: trimmed, $options: "i" } },
      { "contact.email": { $regex: trimmed, $options: "i" } }
    ];
    if (isValidObjectId(trimmed)) {
      // allow direct lookup by _id via the same search box
      or.push({ _id: trimmed });
    }
    query = { $or: or };
  }

  const [items, total] = await Promise.all([
    Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(query)
  ]);

  return { items, total, page, limit };
};

export const getPatient = async (id: string) => {
  return Patient.findById(id).lean();
};

export const createPatient = async (payload: Partial<PatientDoc>) => {
  const doc: any = { ...payload };

  // coerce types safely
  if (doc.dob && typeof doc.dob === "string") {
    const d = toDate(doc.dob);
    if (d) doc.dob = d;
  }

  // default arrays to [] so UI shows them immediately
  doc.allergies ??= [];
  doc.conditions ??= [];
  doc.medications ??= [];
  doc.immunizations ??= [];
  doc.diagnoses ??= [];

  return Patient.create(doc);
};

export const updatePatient = async (id: string, payload: Partial<PatientDoc>) => {
  const patch: any = { ...payload };

  if (patch.dob && typeof patch.dob === "string") {
    const d = toDate(patch.dob);
    if (d) patch.dob = d;
  }

  // allow contact + demographics + clinical blobs to flow through
  return Patient.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
};

export const updateAllergiesAndConditions = async (
  id: string,
  payload: { allergies?: any[]; conditions?: any[] }
) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { allergies: payload.allergies || [], conditions: payload.conditions || [] } },
    { new: true, runValidators: true }
  ).lean();
};

export const deletePatient = async (id: string) => {
  await Patient.findByIdAndDelete(id);
};

export const updateMedications = async (id: string, medications: any) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { medications } },
    { new: true, runValidators: true }
  ).lean();
};

export const updateImmunizations = async (id: string, immunizations: any) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { immunizations } },
    { new: true, runValidators: true }
  ).lean();
};
