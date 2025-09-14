import Patient, { PatientDoc } from "../models/Patient";

export const searchPatients = async (q: string, opts: any) => {
  const page = Number(opts.page || 1);
  const limit = Number(opts.limit || 20);
  const skip = (page - 1) * limit;
  const query = q
    ? {
        $or: [
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { "contact.phone": { $regex: q, $options: "i" } },
          { "contact.email": { $regex: q, $options: "i" } }
        ]
      }
    : {};
  const [items, total] = await Promise.all([
    Patient.find(query).skip(skip).limit(limit),
    Patient.countDocuments(query)
  ]);
  return { items, total, page, limit };
};

export const getPatient = async (id: string) => {
  return Patient.findById(id);
};

export const createPatient = async (payload: Partial<PatientDoc>) => {
  return Patient.create(payload);
};

export const updatePatient = async (id: string, payload: Partial<PatientDoc>) => {
  return Patient.findByIdAndUpdate(id, payload, { new: true });
};

export const updateAllergiesAndConditions = async (
  id: string,
  payload: { allergies?: any[]; conditions?: any[] }
) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { allergies: payload.allergies || [], conditions: payload.conditions || [] } },
    { new: true }
  );
};

export const deletePatient = async (id: string) => {
  await Patient.findByIdAndDelete(id);
};
export const updateMedications = async (id: string, medications: any) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { medications } },
    { new: true, runValidators: true }
  );
};

export const updateImmunizations = async (id: string, immunizations: any) => {
  return Patient.findByIdAndUpdate(
    id,
    { $set: { immunizations } },
    { new: true, runValidators: true }
  );
};
