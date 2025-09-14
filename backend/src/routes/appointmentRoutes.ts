import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import {
  list,
  create,
  getOne,
  update,
  cancel,
  availability
} from "../controllers/appointmentController";

const router = Router();

router.use(protect);
router.get("/", allowRoles("admin", "provider", "billing", "viewer"), list);
router.get("/availability", allowRoles("admin", "provider", "viewer"), availability);
router.get("/:id", allowRoles("admin", "provider", "billing", "viewer"), getOne);
router.post("/", allowRoles("admin", "provider"), create);
router.put("/:id", allowRoles("admin", "provider"), update);
router.delete("/:id", allowRoles("admin", "provider"), cancel);

export default router;
