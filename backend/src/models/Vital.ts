import { Schema, model, models, Model, Document, Types } from "mongoose";

export interface VitalDoc extends Document {
  patient: Types.ObjectId;
  date: Date;
  heightCm?: number;
  weightKg?: number;
  tempC?: number;
  pulse?: number;
  resp?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  spo2?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const VitalSchema = new Schema<VitalDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    date: { type: Date, required: true, default: () => new Date(), index: true },

    heightCm: { type: Number, min: 20, max: 300 },
    weightKg: { type: Number, min: 1, max: 500 },
    tempC:    { type: Number, min: 25, max: 45 },
    pulse:    { type: Number, min: 0,  max: 260 },
    resp:     { type: Number, min: 0,  max: 80 },
    bpSystolic:  { type: Number, min: 40,  max: 300 },
    bpDiastolic: { type: Number, min: 20,  max: 200 },
    spo2: { type: Number, min: 0, max: 100 },

    notes: { type: String, maxlength: 1000 }
  },
  { timestamps: true }
);

const Vital: Model<VitalDoc> = (models.Vital as Model<VitalDoc>) || model<VitalDoc>("Vital", VitalSchema);
export default Vital;
