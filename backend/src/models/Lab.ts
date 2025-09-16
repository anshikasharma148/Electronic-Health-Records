import { Schema, model, Document, Types } from "mongoose";

export interface LabDoc extends Document {
  patient: Types.ObjectId;
  test: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabSchema = new Schema<LabDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    test: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<LabDoc>("Lab", LabSchema);
