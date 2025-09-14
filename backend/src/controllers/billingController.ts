import { Request, Response, NextFunction } from "express";
import * as billingService from "../services/billingService";

export const eligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.checkEligibility(String(req.query.patientId));
    res.json(r);
  } catch (e) { next(e); }
};

export const listClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.listClaims(String(req.query.patientId));
    res.json(r);
  } catch (e) { next(e); }
};

export const createClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.createClaim(req.body);
    res.status(201).json(r);
  } catch (e) { next(e); }
};

export const listPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.listPayments(String(req.query.patientId));
    res.json(r);
  } catch (e) { next(e); }
};

export const getReports = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.getReports();
    res.json(r);
  } catch (e) { next(e); }
};

export const listCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const all = await billingService.listCodes();
    const q = String(req.query.q || "").toLowerCase().trim();
    const type = String(req.query.type || "").toUpperCase().trim();
    const limitRaw = Number(req.query.limit || 50);
    const limit = Math.min(Math.max(isNaN(limitRaw) ? 50 : limitRaw, 1), 200);

    const filtered = all.filter(c => {
      const matchesType = type ? c.type.toUpperCase() === type : true;
      const matchesQ = q
        ? c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        : true;
      return matchesType && matchesQ;
    });

    res.json(filtered.slice(0, limit));
  } catch (e) { next(e); }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = { ...req.body, date: req.body.date || new Date() };
    const r = await billingService.createPayment(payload);
    res.status(201).json(r);
  } catch (e) { next(e); }
};

export const getBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = String(req.query.patientId || "");
    if (!patientId) return res.status(400).json({ message: "patientId_required" });
    const r = await billingService.getBalance(patientId);
    res.json(r);
  } catch (e) { next(e); }
};
