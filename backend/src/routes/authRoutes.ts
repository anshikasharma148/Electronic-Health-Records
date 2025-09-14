import { Router } from "express";
import { login, signup } from "../controllers/authController";
const r = Router();
r.post("/login", login);
r.post("/signup", signup);
export default r;
