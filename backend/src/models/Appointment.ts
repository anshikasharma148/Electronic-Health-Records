import { Schema, model, Document, Types } from "mongoose";

export interface AppointmentDoc extends Document {
  patient: Types.ObjectId;
  providerId: string;
  start: Date;
  end: Date;
  status: "booked" | "cancelled" | "completed" | "rescheduled";
  reason?: string;
  location?: string;
}

const AppointmentSchema = new Schema<AppointmentDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    providerId: { type: String, required: true, index: true },
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true, index: true },
    status: { type: String, enum: ["booked", "cancelled", "completed", "rescheduled"], default: "booked", index: true },
    reason: String,
    location: String
  },
  { timestamps: true }
);

// Helpful read-performance indexes
AppointmentSchema.index({ providerId: 1, status: 1, start: 1, end: 1 });
AppointmentSchema.index({ patient: 1, status: 1, start: 1, end: 1 });

export default model<AppointmentDoc>("Appointment", AppointmentSchema);
