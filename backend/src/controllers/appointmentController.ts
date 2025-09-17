import { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";

// ---- helpers ----
const ensureDates = (start?: Date, end?: Date) => {
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "start and end must be valid ISO datetimes";
  }
  if (start >= end) {
    return "end must be after start";
  }
  return null;
};

const conflictQuery = (start: Date, end: Date, providerId: string, patientId: string, excludeId?: string) => {
  const q: any = {
    status: { $ne: "cancelled" },
    start: { $lt: end },
    end: { $gt: start },
    $or: [{ providerId }, { patient: new Types.ObjectId(patientId) }],
  };
  if (excludeId && isValidObjectId(excludeId)) q._id = { $ne: new Types.ObjectId(excludeId) };
  return q;
};

// ---- GET /api/appointments ----
export const list = async (req: Request, res: Response) => {
  try {
    const {
      patient,
      providerId,
      status,
      date,
      dateFrom,
      dateTo,
      page = "1",
      limit = "20",
      sort = "start",
      order = "asc",
    } = req.query as Record<string, string>;

    const q: any = {};
    if (patient && isValidObjectId(patient)) q.patient = new Types.ObjectId(patient);
    if (providerId) q.providerId = providerId;
    if (status) q.status = status;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);   endOfDay.setHours(23, 59, 59, 999);
      q.start = { $lt: endOfDay };
      q.end = { ...(q.end || {}), $gt: startOfDay };
    } else if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : undefined;
      const to = dateTo ? new Date(dateTo) : undefined;
      if (from) q.end = { ...(q.end || {}), $gt: from };
      if (to) q.start = { ...(q.start || {}), $lt: to };
    }

    const pageNum = Math.max(parseInt(page || "1", 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || "20", 10), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const sortObj: any = { [sort]: order === "desc" ? -1 : 1 };

    const [items, total] = await Promise.all([
      Appointment.find(q)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate("patient", "firstName lastName dob gender")
        .lean(),
      Appointment.countDocuments(q),
    ]);

    res.json({ items, page: pageNum, total });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_list_appointments" });
  }
};

// ---- POST /api/appointments ----
export const create = async (req: Request, res: Response) => {
  try {
    const { patient, providerId, start: startStr, end: endStr, reason, location } = req.body || {};
    if (!isValidObjectId(patient)) return res.status(400).json({ message: "invalid patient id" });
    if (!providerId) return res.status(400).json({ message: "providerId is required" });

    const start = new Date(startStr);
    const end = new Date(endStr);
    const dateErr = ensureDates(start, end);
    if (dateErr) return res.status(400).json({ message: dateErr });

    const pat = await Patient.findById(patient).select("_id").lean();
    if (!pat) return res.status(404).json({ message: "patient_not_found" });

    // conflict check against same provider OR same patient
    const conflict = await Appointment.findOne(conflictQuery(start, end, providerId, patient)).lean();
    if (conflict) {
      const type = String(conflict.providerId) === String(providerId) ? "provider" : "patient";
      return res.status(409).json({
        message: "conflict_with_existing_appointment",
        conflictId: conflict._id,
        conflictStart: conflict.start,
        conflictEnd: conflict.end,
        conflictType: type,
      });
    }

    const appt = await Appointment.create({
      patient,
      providerId,
      start,
      end,
      reason,
      location,
      status: "booked",
    });

    const populated = await appt.populate("patient", "firstName lastName dob gender");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_create_appointment" });
  }
};

// ---- GET /api/appointments/:id ----
export const getOne = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid id" });
    const appt = await Appointment.findById(id)
      .populate("patient", "firstName lastName dob gender")
      .lean();
    if (!appt) return res.status(404).json({ message: "not_found" });
    res.json(appt);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_get_appointment" });
  }
};

// ---- PUT /api/appointments/:id ----
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "not_found" });

    const { start: startStr, end: endStr, reason, location, status } = req.body || {};

    if (startStr || endStr) {
      const newStart = startStr ? new Date(startStr) : appt.start;
      const newEnd = endStr ? new Date(endStr) : appt.end;

      const dateErr = ensureDates(newStart, newEnd);
      if (dateErr) return res.status(400).json({ message: dateErr });

      // conflict (exclude self) for same provider OR same patient
      const conflict = await Appointment.findOne(
        conflictQuery(newStart, newEnd, appt.providerId, String(appt.patient), id)
      ).lean();

      if (conflict) {
        const type = String(conflict.providerId) === String(appt.providerId) ? "provider" : "patient";
        return res.status(409).json({
          message: "conflict_with_existing_appointment",
          conflictId: conflict._id,
          conflictStart: conflict.start,
          conflictEnd: conflict.end,
          conflictType: type,
        });
      }

      appt.start = newStart;
      appt.end = newEnd;

      if (appt.isModified("start") || appt.isModified("end")) {
        if (!status || (status !== "cancelled" && status !== "completed")) {
          appt.status = "rescheduled";
        }
      }
    }

    if (typeof reason === "string") appt.reason = reason;
    if (typeof location === "string") appt.location = location;
    if (status && ["booked", "cancelled", "completed", "rescheduled"].includes(status)) {
      appt.status = status as any;
    }

    await appt.save();
    const populated = await appt.populate("patient", "firstName lastName dob gender");
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_update_appointment" });
  }
};

// ---- DELETE /api/appointments/:id ----
export const cancel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "not_found" });

    appt.status = "cancelled";
    await appt.save();

    const populated = await appt.populate("patient", "firstName lastName dob gender");
    res.json({ success: true, appointment: populated });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_cancel_appointment" });
  }
};

// ---- GET /api/appointments/availability ----
export const availability = async (req: Request, res: Response) => {
  try {
    const { providerId, date, slotMins } = req.query as Record<string, string>;
    if (!providerId) return res.status(400).json({ message: "providerId is required" });
    if (!date) return res.status(400).json({ message: "date (YYYY-MM-DD) is required" });

    const mins = Math.max(parseInt(slotMins || "30", 10) || 30, 5);

    const base = new Date(date);
    if (isNaN(base.getTime())) return res.status(400).json({ message: "invalid date" });

    const startOfDay = new Date(base); startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(base);   endOfDay.setHours(17, 0, 0, 0);

    const existing = await Appointment.find({
      providerId,
      status: { $ne: "cancelled" },
      start: { $lt: endOfDay },
      end: { $gt: startOfDay },
    }).select("start end").lean();

    const slots: { start: Date; end: Date }[] = [];
    for (let t = startOfDay.getTime(); t + mins * 60000 <= endOfDay.getTime(); t += mins * 60000) {
      const s = new Date(t);
      const e = new Date(t + mins * 60000);
      slots.push({ start: s, end: e });
    }

    const available = slots.filter(({ start, end }) => {
      return !existing.some((x) => x.start < end && x.end > start);
    });

    res.json({
      providerId,
      date,
      slotMins: mins,
      slots: available.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
    });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "failed_to_get_availability" });
  }
};
