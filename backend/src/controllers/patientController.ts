import { Request, Response, NextFunction } from "express";
import * as patientService from "../services/patientService";

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || "");
    const r = await patientService.searchPatients(q, req.query);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.getPatient(req.params.id);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const createOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.createPatient(req.body);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const updateOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.updatePatient(req.params.id, req.body);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const updateAllergiesConditions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await patientService.updateAllergiesAndConditions(req.params.id, req.body);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const updateMedications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Array.isArray(req.body.medications)) {
      return res.status(400).json({ message: "medications must be an array" });
    }
    const r = await patientService.updateMedications(req.params.id, req.body.medications);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const updateImmunizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Array.isArray(req.body.immunizations)) {
      return res.status(400).json({ message: "immunizations must be an array" });
    }
    const r = await patientService.updateImmunizations(req.params.id, req.body.immunizations);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const deleteOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await patientService.deletePatient(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
