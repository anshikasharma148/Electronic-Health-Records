import { Schema, model, Document, Types } from "mongoose";

export interface ClinicalNoteDoc extends Document {
  patient: Types.ObjectId;
  authorId: string;
  text: string;
  createdAt: Date;
}

export interface VitalDoc extends Document {
  patient: Types.ObjectId;
  recordedAt: Date;
  heartRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  temperature?: number;
}

export interface LabResultDoc extends Document {
  patient: Types.ObjectId;
  testCode: string;
  testName: string;
  value: string;
  unit?: string;
  takenAt: Date;
}

const ClinicalNoteSchema = new Schema<ClinicalNoteDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    authorId: { type: String, required: true },
    text: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const VitalSchema = new Schema<VitalDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    recordedAt: { type: Date, default: Date.now }, // ✅ auto-sets if not provided
    heartRate: Number,
    bpSystolic: Number,
    bpDiastolic: Number,
    temperature: Number
  },
  { timestamps: true }
);

const LabResultSchema = new Schema<LabResultDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    testCode: { type: String, required: true },
    testName: { type: String, required: true },
    value: { type: String, required: true },
    unit: String,
    takenAt: { type: Date, default: Date.now } // ✅ auto-sets if not provided
  },
  { timestamps: true }
);

export const ClinicalNote = model<ClinicalNoteDoc>("ClinicalNote", ClinicalNoteSchema);
export const Vital = model<VitalDoc>("Vital", VitalSchema);
export const LabResult = model<LabResultDoc>("LabResult", LabResultSchema);
