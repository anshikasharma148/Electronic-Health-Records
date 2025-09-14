import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import {
  search,
  getById,
  createOne,
  updateOne,
  updateAllergiesConditions,
  updateMedications,
  updateImmunizations,
  deleteOne
} from "../controllers/patientController";

const r = Router();
r.use(protect);

r.get("/", allowRoles("admin", "provider", "billing", "viewer"), search);
r.get("/:id", allowRoles("admin", "provider", "billing", "viewer"), getById);
r.post("/", allowRoles("admin", "provider"), createOne);
r.put("/:id", allowRoles("admin", "provider"), updateOne);
r.patch("/:id/allergies-conditions", allowRoles("admin", "provider"), updateAllergiesConditions);
r.patch("/:id/medications", allowRoles("admin", "provider"), updateMedications);
r.patch("/:id/immunizations", allowRoles("admin", "provider"), updateImmunizations);
r.delete("/:id", allowRoles("admin"), deleteOne);

export default r;
