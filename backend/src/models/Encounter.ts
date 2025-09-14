import { Schema, model, Document, Types } from "mongoose";

export interface EncounterDoc extends Document {
  patient: Types.ObjectId;
  providerId: string;
  reason?: string;
  diagnosisCodes?: string[];
  procedureCodes?: string[];
  start: Date;
  end?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EncounterSchema = new Schema<EncounterDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    providerId: { type: String, required: true, index: true },
    reason: String,
    diagnosisCodes: [String],
    procedureCodes: [String],
    start: { type: Date, required: true },
    end: Date,
    notes: String
  },
  { timestamps: true }
);

EncounterSchema.index({ patient: 1, start: -1 });

export default model<EncounterDoc>("Encounter", EncounterSchema);
