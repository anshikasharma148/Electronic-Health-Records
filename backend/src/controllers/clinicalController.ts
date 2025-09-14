import { Request, Response, NextFunction } from "express";
import * as clinicalService from "../services/clinicalService";

export const listOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.getOverview(String(req.query.patientId));
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const addNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.addNote({
      ...req.body,
      createdAt: req.body.createdAt || new Date()
    });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const recordVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.recordVitals({
      ...req.body,
      recordedAt: req.body.recordedAt || new Date()
    });
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const listLabs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.listLabs(String(req.query.patientId));
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const addDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, diagnoses } = req.body;
    if (!patientId || !Array.isArray(diagnoses)) {
      return res.status(400).json({ message: "patientId and diagnoses[] are required" });
    }
    const r = await clinicalService.addDiagnosis(patientId, diagnoses);
    res.status(201).json({ message: "diagnoses_added", patient: r });
  } catch (e) {
    next(e);
  }
};

/* === additions below === */
export const updateVital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.updateVital(req.params.id, req.body);
    if (!r) return res.status(404).json({ message: "not_found" });
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const addLab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.addLab(req.body);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const addEncounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.addEncounter(req.body);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
};

export const listEncounters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.listEncounters(String(req.query.patientId));
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await clinicalService.getHistory(String(req.query.patientId), Number(req.query.limit || 50));
    res.json(r);
  } catch (e) {
    next(e);
  }
};
