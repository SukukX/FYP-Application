import { Router } from "express";
import { getAdminOverview, approveRegulator, rejectRegulator, toggleUserStatus } from "../controllers/admin.controller";
import { getAuditLogs } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All admin routes are protected
router.use(authenticate, authorize(["admin"]));

router.get("/overview", getAdminOverview);
router.post("/regulators/approve", approveRegulator);
router.post("/regulators/reject", rejectRegulator);
router.post("/users/toggle-status", toggleUserStatus);
router.get("/audit-logs", getAuditLogs);

export default router;
