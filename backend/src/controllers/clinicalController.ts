import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import * as clinicalService from "../services/clinicalService";

/** Utility: coerce to trimmed string */
const s = (v: any) => (typeof v === "string" ? v.trim() : "");

/** Utility: ISO/date -> Date (or undefined) */
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};

export const listOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.query.patientId);
    if (!isValidObjectId(patientId)) {
      // keep the shape the frontend expects instead of a 400
      return res.json({ notes: [], vitals: [], labs: [] });
    }
    const r = await clinicalService.getOverview(patientId);
    res.json(r); // service already returns arrays with UI-friendly fields
  } catch (e) {
    next(e);
  }
};

export const addNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.body.patientId);
    const text = s(req.body.text);
    const createdAt = toDate(req.body.createdAt) ?? new Date();

    if (!isValidObjectId(patientId)) return res.status(400).json({ message: "invalid patient id" });
    if (!text) return res.status(400).json({ message: "text_required" });

    // pull an author identifier from the auth middleware if present
    const u: any = (req as any).user || {};
    const authorId = String(u.id || u._id || u.email || "system");

    const r = await clinicalService.addNote({ patientId, text, createdAt, authorId });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const recordVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.body.patientId);
    const recordedAt = toDate(req.body.recordedAt ?? req.body.when) ?? new Date();
    const hrNum = Number(req.body.hr);
    const bp = s(req.body.bp);

    if (!isValidObjectId(patientId)) return res.status(400).json({ message: "invalid patient id" });
    if (!recordedAt) return res.status(400).json({ message: "invalid recordedAt" });
    if (Number.isNaN(hrNum)) return res.status(400).json({ message: "invalid hr" });
    if (!bp) return res.status(400).json({ message: "bp_required" });

    const r = await clinicalService.recordVitals({ patientId, recordedAt, hr: hrNum, bp });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const listLabs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.query.patientId);
    if (!isValidObjectId(patientId)) {
      return res.json([]); // empty list rather than error
    }
    const r = await clinicalService.listLabs(patientId);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const addDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.body.patientId);
    const diagnoses = Array.isArray(req.body.diagnoses) ? req.body.diagnoses : [];

    if (!isValidObjectId(patientId)) return res.status(400).json({ message: "invalid patient id" });
    if (!Array.isArray(diagnoses) || diagnoses.length === 0) {
      return res.status(400).json({ message: "patientId and diagnoses[] are required" });
    }

    const r = await clinicalService.addDiagnosis(patientId, diagnoses);
    res.status(201).json({ message: "diagnoses_added", patient: r });
  } catch (e) {
    next(e);
  }
};

/* === Vitals update (UI -> schema mapping happens in service) === */
export const updateVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = s(req.params.id);
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const r = await clinicalService.updateVital(id, {
      hr: req.body.hr,
      bp: req.body.bp,
      recordedAt: req.body.recordedAt ?? req.body.when,
    });

    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const addLab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.body.patientId);
    const test = s(req.body.test);
    const value = s(req.body.value);
    const createdAt = toDate(req.body.createdAt) ?? new Date();

    if (!isValidObjectId(patientId)) return res.status(400).json({ message: "invalid patient id" });
    if (!test) return res.status(400).json({ message: "test_required" });
    if (!value) return res.status(400).json({ message: "value_required" });

    const r = await clinicalService.addLab({ patientId, test, value, createdAt });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const addEncounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = { ...req.body };
    if (!isValidObjectId(s(payload.patientId))) {
      return res.status(400).json({ message: "invalid patient id" });
    }
    const r = await clinicalService.addEncounter(payload);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const listEncounters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.query.patientId);
    if (!isValidObjectId(patientId)) return res.json([]);
    const r = await clinicalService.listEncounters(patientId);
    res.json(Array.isArray(r) ? r : []);
  } catch (e) {
    next(e);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = s(req.query.patientId);
    const limitNum = Math.max(1, Math.min(200, Number(req.query.limit || 50)));

    if (!isValidObjectId(patientId)) return res.json([]);
    const r = await clinicalService.getHistory(patientId, limitNum);
    res.json(Array.isArray(r) ? r : []);
  } catch (e) {
    next(e);
  }
};
