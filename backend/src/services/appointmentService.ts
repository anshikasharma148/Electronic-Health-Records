import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import { startOfDay, endOfDay, addHours } from "date-fns";

const overlapOr = (start: Date, end: Date, providerId: string, patientId: string, excludeId?: string) => {
  const q: any = {
    status: { $ne: "cancelled" },
    start: { $lt: end },
    end: { $gt: start },
    $or: [{ providerId }, { patient: patientId }],
  };
  if (excludeId) q._id = { $ne: excludeId };
  return q;
};

export const listAppointments = async (opts: any) => {
  const page = Number(opts.page || 1);
  const limit = Number(opts.limit || 20);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (opts.patientId) filter.patient = opts.patientId;
  if (opts.providerId) filter.providerId = opts.providerId;
  if (opts.status) filter.status = String(opts.status);
  if (opts.date) {
    const d = new Date(String(opts.date));
    const e = new Date(d);
    e.setDate(e.getDate() + 1);
    filter.start = { $gte: d, $lt: e };
  }

  const [items, total] = await Promise.all([
    Appointment.find(filter).sort({ start: 1 }).populate("patient").skip(skip).limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

export const bookAppointment = async (payload: any) => {
  const patient = await Patient.findById(payload.patient);
  if (!patient) throw Object.assign(new Error("patient_not_found"), { status: 404 });

  const start = new Date(payload.start);
  const end = new Date(payload.end);
  if (!(start instanceof Date) || isNaN(start.valueOf()) || !(end instanceof Date) || isNaN(end.valueOf()) || end <= start) {
    throw Object.assign(new Error("invalid_time_range"), { status: 400 });
  }

  const conflict = await Appointment.findOne(overlapOr(start, end, payload.providerId, payload.patient)).lean();
  if (conflict) {
    const conflictType = String(conflict.providerId) === String(payload.providerId) ? "provider" : "patient";
    const err = Object.assign(new Error("conflict"), { status: 409 });
    (err as any).details = {
      conflictId: conflict._id,
      conflictStart: conflict.start,
      conflictEnd: conflict.end,
      conflictType,
    };
    throw err;
  }

  return Appointment.create({ ...payload, start, end });
};

export const getAppointment = async (id: string) => {
  return Appointment.findById(id).populate("patient");
};

export const rescheduleAppointment = async (id: string, payload: any) => {
  const current = await Appointment.findById(id);
  if (!current) throw Object.assign(new Error("not_found"), { status: 404 });

  const newStart = payload.start ? new Date(payload.start) : current.start;
  const newEnd = payload.end ? new Date(payload.end) : current.end;
  const provider = payload.providerId || current.providerId;

  if (!(newStart instanceof Date) || isNaN(newStart.valueOf()) || !(newEnd instanceof Date) || isNaN(newEnd.valueOf()) || newEnd <= newStart) {
    throw Object.assign(new Error("invalid_time_range"), { status: 400 });
  }

  const conflict = await Appointment.findOne(
    overlapOr(newStart, newEnd, provider, String(current.patient), id)
  ).lean();

  if (conflict) {
    const conflictType = String(conflict.providerId) === String(provider) ? "provider" : "patient";
    const err = Object.assign(new Error("conflict"), { status: 409 });
    (err as any).details = {
      conflictId: conflict._id,
      conflictStart: conflict.start,
      conflictEnd: conflict.end,
      conflictType,
    };
    throw err;
  }

  current.set({ ...payload, start: newStart, end: newEnd, providerId: provider });
  current.status = "rescheduled";
  await current.save();
  return current;
};

export const cancelAppointment = async (id: string) => {
  const current = await Appointment.findById(id);
  if (!current) throw Object.assign(new Error("not_found"), { status: 404 });
  current.status = "cancelled";
  await current.save();
};

export const checkAvailability = async (providerId: string, dateStr: string) => {
  const date = new Date(dateStr);
  const startDay = startOfDay(date);
  const endDay = endOfDay(date);

  const appts = await Appointment.find({
    providerId,
    status: { $ne: "cancelled" },
    start: { $gte: startDay, $lte: endDay },
  });

  const availableSlots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    const slotStart = addHours(startDay, hour);
    const slotEnd = addHours(slotStart, 1);
    const conflict = appts.some((a) => a.start < slotEnd && a.end > slotStart);
    if (!conflict) availableSlots.push(slotStart.toISOString());
  }

  return {
    providerId,
    date: startDay.toISOString(),
    availableSlots,
    totalBooked: appts.length,
  };
};
