import { Router } from "express";
/**
 * [MODULE] Dashboard Routes
 * -------------------------
 * Purpose: Role-specific data aggregation endpoints.
 * Connections:
 * - Frontend: /dashboard/{role} pages.
 * - Security: Strict RBAC (Role-Based Access Control) enforced by 'authorize' middleware.
 */
import { getUserDashboard, getRegulatorDashboard, getAuditLogs } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/user", authenticate, authorize(["user"]), getUserDashboard);
router.get("/regulator", authenticate, authorize(["regulator", "admin"]), getRegulatorDashboard);
router.get("/logs", authenticate, authorize(["regulator", "admin"]), getAuditLogs);

export default router;
