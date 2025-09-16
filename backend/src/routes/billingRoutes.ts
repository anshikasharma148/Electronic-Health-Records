import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { allowRoles } from "../security/rbac";
import {
  eligibility,
  listClaims,
  createClaim,
  listPayments,
  getReports,
  listCodes,
  createPayment,
  getBalance
} from "../controllers/billingController";
import * as billing from "../controllers/billingController";

const router = Router();

router.use(protect);

router.get("/eligibility", allowRoles("admin", "billing"), eligibility);
router.get("/claims", allowRoles("admin", "billing"), listClaims);
router.post("/claims", allowRoles("admin", "billing"), createClaim);

router.get("/payments", allowRoles("admin", "billing"), listPayments);
router.post("/payments", allowRoles("admin", "billing"), createPayment);

router.get("/balance", allowRoles("admin", "billing"), getBalance);
router.get("/reports", allowRoles("admin", "billing"), getReports);
router.get("/codes", allowRoles("admin", "billing"), listCodes);
router.put(
  "/claims/:id",
  allowRoles("admin", "billing"),
  billing.updateClaimStatus
);

export default router;
