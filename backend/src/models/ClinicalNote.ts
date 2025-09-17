import { Schema, model, models, Model, Document, Types } from "mongoose";

export interface ClinicalNoteDoc extends Document {
  patient: Types.ObjectId;
  authorId: string;     // who wrote the note
  noteType?: string;    // e.g., "progress", "discharge", etc.
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClinicalNoteSchema = new Schema<ClinicalNoteDoc>(
  {
    patient:  { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    authorId: { type: String, required: true }, // will be auto-filled from req.user if missing
    noteType: { type: String },
    content:  { type: String, required: true },
  },
  { timestamps: true }
);

const ClinicalNote: Model<ClinicalNoteDoc> =
  (models.ClinicalNote as Model<ClinicalNoteDoc>) || model<ClinicalNoteDoc>("ClinicalNote", ClinicalNoteSchema);

export default ClinicalNote;
