import { Request, Response, NextFunction } from "express";
import * as patientService from "../services/patientService";
import { isValidObjectId } from "mongoose";
import Patient from "../models/Patient";

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const r = await patientService.searchPatients(q, req.query);
    res.json(r);
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.getPatient(req.params.id);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) { next(e); }
};

export const createOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.createPatient(req.body);
    res.status(201).json(r);
  } catch (e) { next(e); }
};

export const updateOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.updatePatient(req.params.id, req.body);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) { next(e); }
};

export const updateAllergiesConditions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.updateAllergiesAndConditions(req.params.id, req.body);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) { next(e); }
};

export const updateMedications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Array.isArray(req.body.medications)) {
      return res.status(400).json({ message: "medications must be an array" });
    }
    const r = await patientService.updateMedications(req.params.id, req.body.medications);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) { next(e); }
};

export const updateImmunizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Array.isArray(req.body.immunizations)) {
      return res.status(400).json({ message: "immunizations must be an array" });
    }
    const r = await patientService.updateImmunizations(req.params.id, req.body.immunizations);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) { next(e); }
};

export const deleteOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await patientService.deletePatient(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};
export const updatePatient = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const me = req.user; // assuming set by protect()
    const isEditor = me && (me.role === "admin" || me.role === "provider");

    const body = req.body || {};
    const patch: any = {};

    // Always allow contact edits (keeps current behavior)
    if (body.contact && typeof body.contact === "object") {
      patch["contact.phone"]   = typeof body.contact.phone   === "string" ? body.contact.phone.trim()   : undefined;
      patch["contact.email"]   = typeof body.contact.email   === "string" ? body.contact.email.trim()   : undefined;
      patch["contact.address"] = typeof body.contact.address === "string" ? body.contact.address.trim() : undefined;
    }

    // Allow demographics only for admin/provider
    if (isEditor) {
      if (typeof body.firstName === "string") patch.firstName = body.firstName.trim();
      if (typeof body.lastName  === "string") patch.lastName  = body.lastName.trim();
      if (typeof body.gender    === "string") {
        const g = body.gender.trim().toLowerCase();
        const allowed = new Set(["male","female","other","unknown"]);
        if (allowed.has(g)) patch.gender = g;
      }
      if (body.dob) {
        const d = new Date(body.dob);
        if (!isNaN(d.getTime())) patch.dob = d;
      }
    }

    // Clinical arrays (keep your existing behavior)
    const pass = (x: any) => Array.isArray(x) && x.length > 0 ? x : undefined;
    if (isEditor) {
      if (pass(body.allergies))     patch.allergies     = body.allergies;
      if (pass(body.conditions))    patch.conditions    = body.conditions;
      if (pass(body.medications))   patch.medications   = body.medications;
      if (pass(body.immunizations)) patch.immunizations = body.immunizations;
      if (pass(body.diagnoses))     patch.diagnoses     = body.diagnoses;
    }

    // Remove undefineds to avoid overwriting with undefined
    Object.keys(patch).forEach(k => patch[k] === undefined && delete patch[k]);

    const updated = await Patient.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean();
    if (!updated) return res.status(404).json({ message: "not_found" });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "update_failed" });
  }
};