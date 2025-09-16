// types/api.ts
export type ObjectId = string;

export type Allergy = { _id?: ObjectId; code?: string; description?: string };
export type Condition = { _id?: ObjectId; code?: string; description?: string };
export type Medication = { _id?: ObjectId; code?: string; name?: string; dosage?: string };
export type Immunization = { _id?: ObjectId; code?: string; name?: string; date?: string };
export type Diagnosis = { _id?: ObjectId; code: string; description?: string; type?: "diagnosis" | "procedure" };

export type Patient = {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  contact?: { phone?: string; email?: string; address?: string };
  allergies?: Allergy[];
  conditions?: Condition[];
  medications?: Medication[];
  immunizations?: Immunization[];
  diagnoses?: Diagnosis[];
  ehrId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Appointment = {
  _id: ObjectId;
  patient: ObjectId | Pick<Patient, "_id" | "firstName" | "lastName" | "dob" | "gender">;
  providerId: string;
  start: string; // ISO
  end: string;   // ISO
  status: "booked" | "cancelled" | "completed" | "rescheduled";
  reason?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = { items: T[]; page: number; total: number };
