import { Schema, model, Document, Types } from "mongoose";

export interface VitalDoc extends Document {
  patient: Types.ObjectId;
  when: Date;
  hr: number;
  bp: string;
  createdAt: Date;
  updatedAt: Date;
}

const VitalSchema = new Schema<VitalDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    when: { type: Date, required: true },
    hr: { type: Number, required: true },
    bp: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<VitalDoc>("Vital", VitalSchema);
