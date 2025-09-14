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

router.get("/overview", allowRoles("admin", "provider", "viewer"), listOverview);
router.post("/notes", allowRoles("admin", "provider"), addNote);
router.post("/vitals", allowRoles("admin", "provider"), recordVitals);
router.get("/labs", allowRoles("admin", "provider", "viewer"), listLabs);
router.post("/diagnoses", allowRoles("admin", "provider"), addDiagnosis);

/* === additions below === */
router.put("/vitals/:id", allowRoles("admin", "provider"), updateVital);
router.post("/labs", allowRoles("admin", "provider"), addLab);
router.get("/encounters", allowRoles("admin", "provider", "viewer"), listEncounters);
router.post("/encounters", allowRoles("admin", "provider"), addEncounter);
router.get("/history", allowRoles("admin", "provider", "viewer"), getHistory);

export default router;
