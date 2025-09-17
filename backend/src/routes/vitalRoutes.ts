import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import {
  listVitals,
  getVital,
  createVital,
  updateVital,
  deleteVital
} from "../controllers/vitalController";

const r = Router();
r.use(protect);

// read/list for admin, provider, billing, viewer
r.get("/",    allowRoles("admin", "provider", "billing", "viewer"), listVitals);
r.get("/:id", allowRoles("admin", "provider", "billing", "viewer"), getVital);

// create/update/delete for admin & provider
r.post("/",    allowRoles("admin", "provider"), createVital);
r.put("/:id",  allowRoles("admin", "provider"), updateVital);
r.delete("/:id", allowRoles("admin", "provider"), deleteVital);

export default r;
