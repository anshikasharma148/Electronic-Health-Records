import { Schema, model, models, Model, Document, Types } from "mongoose";

export interface LabResultDoc extends Document {
  patient: Types.ObjectId;
  testName: string;
  testCode: string;
  result?: string;
  units?: string;
  referenceRange?: string;
  status?: "ordered" | "in-progress" | "final";
  collectedAt?: Date;
  reportedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const LabResultSchema = new Schema<LabResultDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    testName: { type: String, required: true },
    testCode: { type: String, required: true },
    result: { type: String },
    units: { type: String },
    referenceRange: { type: String },
    status: { type: String, enum: ["ordered", "in-progress", "final"], default: "ordered" },
    collectedAt: { type: Date },
    reportedAt: { type: Date },
  },
  { timestamps: true }
);

const LabResult: Model<LabResultDoc> =
  (models.LabResult as Model<LabResultDoc>) || model<LabResultDoc>("LabResult", LabResultSchema);

export default LabResult;
