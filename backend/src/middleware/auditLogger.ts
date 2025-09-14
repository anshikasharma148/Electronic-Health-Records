import { Request, Response, NextFunction } from "express";
import AuditLog from "../models/AuditLog";
export const auditLogger = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    await AuditLog.create({
      actorId: req.user?.id || null,
      actorRole: req.user?.role || null,
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date()
    });
  } catch {}
  next();
};
