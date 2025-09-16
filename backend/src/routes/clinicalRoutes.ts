import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import {
  listOverview,
  addNote,
  recordVitals,
  listLabs,
  addDiagnosis,
  updateVital,
  addLab,
  addEncounter,
  listEncounters,
  getHistory
} from "../controllers/clinicalController";

const router = Router();

router.use(protect);

/**
 * Allow read-only access to admin/provider/viewer/billing for data fetches,
 * but restrict mutations to admin/provider (matches your UI).
 */
router.get("/overview",  allowRoles("admin", "provider", "viewer", "billing"), listOverview);
router.get("/labs",      allowRoles("admin", "provider", "viewer", "billing"), listLabs);
router.get("/encounters",allowRoles("admin", "provider", "viewer", "billing"), listEncounters);
router.get("/history",   allowRoles("admin", "provider", "viewer", "billing"), getHistory);

router.post("/notes",    allowRoles("admin", "provider"), addNote);
router.post("/vitals",   allowRoles("admin", "provider"), recordVitals);
router.put("/vitals/:id",allowRoles("admin", "provider"), updateVital);
router.post("/labs",     allowRoles("admin", "provider"), addLab);
router.post("/diagnoses",allowRoles("admin", "provider"), addDiagnosis);
router.post("/encounters",allowRoles("admin", "provider"), addEncounter);

export default router;
