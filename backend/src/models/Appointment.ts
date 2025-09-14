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
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    providerId: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: ["booked", "cancelled", "completed", "rescheduled"], default: "booked" },
    reason: String,
    location: String
  },
  { timestamps: true }
);

export default model<AppointmentDoc>("Appointment", AppointmentSchema);
