import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import { searchPatientsEhr, getPatientEhr } from "../controllers/ehrController";

const r = Router();
r.use(protect);
r.get("/patients", allowRoles("admin", "provider", "viewer"), searchPatientsEhr);
r.get("/patients/:ehrId", allowRoles("admin", "provider", "viewer"), getPatientEhr);
export default r;
