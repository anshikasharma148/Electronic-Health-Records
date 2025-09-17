import { Request, Response, NextFunction } from "express";
import { isValidObjectId, Types } from "mongoose";
import Vital from "../models/Vital";

const toNumber = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
const toDate = (v: unknown) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
};

// GET /api/vitals?patientId=&from=&to=&page=&limit=&sort=date&order=desc
export const listVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      patientId,
      from,
      to,
      page = "1",
      limit = "50",
      sort = "date",
      order = "desc",
    } = req.query as Record<string, string>;

    const q: any = {};
    if (patientId && isValidObjectId(patientId)) {
      q.patient = new Types.ObjectId(patientId);
    }
    const fromD = toDate(from);
    const toD   = toDate(to);
    if (fromD || toD) {
      q.date = {};
      if (fromD) q.date.$gte = fromD;
      if (toD)   q.date.$lte = toD;
    }

    const pageNum  = Math.max(parseInt(page || "1", 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || "50", 10), 1), 200);
    const skip     = (pageNum - 1) * limitNum;
    const sortObj: any = { [sort || "date"]: order === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Vital.find(q).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Vital.countDocuments(q),
    ]);

    res.json({ items, page: pageNum, total });
  } catch (e) {
    next(e);
  }
};

// GET /api/vitals/:id
export const getVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid_id" });
    const v = await Vital.findById(id).lean();
    if (!v) return res.status(404).json({ message: "not_found" });
    res.json(v);
  } catch (e) {
    next(e);
  }
};

// POST /api/vitals
export const createVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      patient,
      date,
      heightCm,
      weightKg,
      tempC,
      pulse,
      resp,
      bpSystolic,
      bpDiastolic,
      spo2,
      notes,
    } = req.body || {};

    if (!isValidObjectId(patient)) {
      return res.status(400).json({ message: "invalid_patient" });
    }

    const doc = await Vital.create({
      patient: new Types.ObjectId(patient),
      date: toDate(date) || new Date(),
      heightCm: toNumber(heightCm),
      weightKg: toNumber(weightKg),
      tempC:    toNumber(tempC),
      pulse:    toNumber(pulse),
      resp:     toNumber(resp),
      bpSystolic:  toNumber(bpSystolic),
      bpDiastolic: toNumber(bpDiastolic),
      spo2: toNumber(spo2),
      notes: typeof notes === "string" ? notes : undefined,
    });

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
};

// PUT /api/vitals/:id
export const updateVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid_id" });

    const payload: any = {};
    const fields = [
      "date",
      "heightCm",
      "weightKg",
      "tempC",
      "pulse",
      "resp",
      "bpSystolic",
      "bpDiastolic",
      "spo2",
      "notes",
    ] as const;

    for (const f of fields) {
      if (f === "date" && req.body.date != null) payload.date = toDate(req.body.date);
      else if (f === "notes" && typeof req.body.notes === "string") payload.notes = req.body.notes;
      else if (req.body[f] != null) payload[f] = toNumber(req.body[f]);
    }

    const updated = await Vital.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "not_found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/vitals/:id
export const deleteVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid_id" });
    const v = await Vital.findByIdAndDelete(id);
    if (!v) return res.status(404).json({ message: "not_found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
