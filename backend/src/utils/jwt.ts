import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../middleware/authMiddleware";

export const signToken = (payload: AuthUser) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "8h" });
};
