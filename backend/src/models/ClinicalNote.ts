import { Schema, model, Document, Types } from "mongoose";

export interface ClinicalNoteDoc extends Document {
  patient: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalNoteSchema = new Schema<ClinicalNoteDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<ClinicalNoteDoc>("ClinicalNote", ClinicalNoteSchema);
