import { Schema, model, Document } from "mongoose";

export interface PatientDoc extends Document {
  firstName: string;
  lastName: string;
  dob: Date;
  gender: string;
  contact: { phone?: string; email?: string; address?: string };
  allergies: { code: string; description: string }[];
  conditions: { code: string; description: string }[];
  medications: { code: string; name: string; dosage?: string }[];
  immunizations: { code: string; name: string; date?: Date }[];
  diagnoses: { code: string; description: string; type?: "diagnosis" | "procedure" }[];
  ehrId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<PatientDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    contact: { phone: String, email: String, address: String },
    allergies: [{ code: String, description: String }],
    conditions: [{ code: String, description: String }],
    medications: [{ code: String, name: String, dosage: String }],
    immunizations: [{ code: String, name: String, date: Date }],
    diagnoses: [
      {
        code: { type: String, required: true },
        description: String,
        type: { type: String, enum: ["diagnosis", "procedure"], default: "diagnosis" }
      }
    ],
    ehrId: String
  },
  { timestamps: true }
);

export default model<PatientDoc>("Patient", PatientSchema);
