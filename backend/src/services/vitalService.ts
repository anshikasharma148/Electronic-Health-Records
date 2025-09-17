import { Types } from "mongoose";
import Vital from "../models/Vital";

export const listVitals = async (opts: {
  patientId?: string;
  from?: string;
  to?: string;
  page?: number | string;
  limit?: number | string;
}) => {
  const q: any = {};
  if (opts.patientId && Types.ObjectId.isValid(opts.patientId)) {
    q.patient = new Types.ObjectId(opts.patientId);
  }
  if (opts.from || opts.to) {
    q.date = {};
    if (opts.from) q.date.$gte = new Date(String(opts.from));
    if (opts.to) q.date.$lte = new Date(String(opts.to));
  }

  const page = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 50), 1), 200);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Vital.find(q).sort({ date: -1 }).skip(skip).limit(limit).populate("patient", "firstName lastName"),
    Vital.countDocuments(q)
  ]);

  return { items, total, page, limit };
};

export const getVital = async (id: string) => Vital.findById(id).populate("patient", "firstName lastName");

export const createVital = async (payload: any) => {
  if (payload.patient && Types.ObjectId.isValid(payload.patient)) {
    payload.patient = new Types.ObjectId(payload.patient);
  }
  if (payload.date) payload.date = new Date(payload.date);
  return Vital.create(payload);
};

export const updateVital = async (id: string, payload: any) => {
  if (payload.date) payload.date = new Date(payload.date);
  return Vital.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

export const deleteVital = async (id: string) => {
  await Vital.findByIdAndDelete(id);
};
