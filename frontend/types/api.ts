// types/api.ts

export type ObjectId = string;

export type Allergy = { _id?: ObjectId; code?: string; description?: string };
export type Condition = { _id?: ObjectId; code?: string; description?: string };
export type Medication = { _id?: ObjectId; code?: string; name?: string; dosage?: string };
export type Immunization = { _id?: ObjectId; code?: string; name?: string; date?: string }; // ISO date string
export type Diagnosis = {
  _id?: ObjectId;
  code: string;
  description?: string;
  type?: "diagnosis" | "procedure";
};

export type Patient = {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  dob: string;              // API returns ISO string
  gender: string;
  contact?: { phone?: string; email?: string; address?: string };

  // ⬇️ Add these (optional so existing data doesn’t break)
  allergies?: Allergy[];
  conditions?: Condition[];
  medications?: Medication[];
  immunizations?: Immunization[];
  diagnoses?: Diagnosis[];

  ehrId?: string;
  createdAt?: string;
  updatedAt?: string;
};

// If you don’t already have it:
// export type Paginated<T> = { items: T[]; page: number; total: number };
