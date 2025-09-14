import { Request, Response, NextFunction } from "express";
import * as ehrService from "../services/ehrService";

export const searchPatientsEhr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await ehrService.searchPatients(String(req.query.q || ""));
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const getPatientEhr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await ehrService.getPatient(req.params.ehrId);
    res.json(r);
  } catch (e) {
    next(e);
  }
};
