import { Router } from "express";
import { collectRentCallback } from "../controllers/rent.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * [ROUTE] Rent Management
 * Use Case: Owner logs a rent payment (or system auto-deducts).
 */

router.post(
    "/collect",
    authenticate,
    authorize(["owner", "admin"]), // Only Owner or Admin can trigger rent collection
    collectRentCallback
);

export default router;
