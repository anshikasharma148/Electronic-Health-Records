import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      email: req.body.email,
      password: hashed,
      role: req.body.role || "viewer"
    });
    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token });
  } catch (e) {
    next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ message: "invalid_credentials" });
    const ok = await bcrypt.compare(req.body.password, user.password);
    if (!ok) return res.status(401).json({ message: "invalid_credentials" });
    const token = signToken({ id: user.id, role: user.role });
    res.json({ token });
  } catch (e) {
    next(e);
  }
};
