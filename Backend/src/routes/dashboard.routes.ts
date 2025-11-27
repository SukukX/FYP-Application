import { Router } from "express";
import { getInvestorDashboard, getOwnerDashboard, getRegulatorDashboard } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/investor", authenticate, authorize(["investor"]), getInvestorDashboard);
router.get("/owner", authenticate, authorize(["owner"]), getOwnerDashboard);
router.get("/regulator", authenticate, authorize(["regulator", "admin"]), getRegulatorDashboard);

export default router;
