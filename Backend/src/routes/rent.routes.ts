import { Router } from "express";
import { distributeRent, submitRent } from "../controllers/rent.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();


/**
 * @route   POST /api/rent/submit
 * @desc    Submit a new rent payment (Property Owner)
 * @access  Private (Owner)
 */
router.post("/submit", authenticate, submitRent);

/**
 * @route   POST /api/rent/distribute
 * @desc    Distribute rent for a specific property (Admin only)
 * @access  Private (Admin)
 * @body    { propertyId: number, totalRent: number, periodStart: string, periodEnd: string }
 */
router.post("/distribute", authenticate, authorize(["admin"]), distributeRent);
export default router;
