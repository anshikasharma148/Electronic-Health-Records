import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../middleware/authMiddleware";
export const allowRoles = (...roles: AuthUser["role"][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "forbidden" });
    next();
  };
};
