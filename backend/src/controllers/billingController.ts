// billingController.ts
import { Request, Response, NextFunction } from "express";
import * as billingService from "../services/billingService";
import { isValidObjectId } from "mongoose";

export const eligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.checkEligibility(String(req.query.patientId));
    res.json(r);
  } catch (e) { next(e); }
};


export const updateClaimStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "invalid_id" });
    }

    const allowed = ["pending", "submitted", "paid", "denied"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "invalid_status" });
    }

    const updated = await billingService.updateClaimStatus(id, status as any);
    if (!updated) return res.status(404).json({ message: "not_found" });

    res.json(updated);
  } catch (e) { next(e); }
};

// ✅ Updated: typed/narrowed filters + pagination
export const listClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageNum   = Number.parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limitRaw  = Number.parseInt(String(req.query.limit ?? "100"), 10) || 100;
    const limit     = Math.min(Math.max(limitRaw, 1), 200);

    const orderParam = typeof req.query.order === "string" ? req.query.order.toLowerCase() : "desc";
    const order: "asc" | "desc" = orderParam === "asc" ? "asc" : "desc";

    const patientId  = typeof req.query.patientId  === "string" ? req.query.patientId.trim()  : undefined;
    const providerId = typeof req.query.providerId === "string" ? req.query.providerId.trim() : undefined;
    const status     = typeof req.query.status     === "string" ? req.query.status.trim()     : undefined;
    const sort       = (typeof req.query.sort === "string" && req.query.sort.trim()) || "createdAt";

    const opts = {
      patientId,
      providerId,
      status,
      page: pageNum,
      limit,
      sort,
      order,
    } satisfies Parameters<typeof billingService.listClaims>[0];

    const r = await billingService.listClaims(opts);
    res.json(r);
  } catch (e) { next(e); }
};

export const createClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await billingService.createClaim({ ...req.body });
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
      const matchesQ = q ? c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) : true;
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
