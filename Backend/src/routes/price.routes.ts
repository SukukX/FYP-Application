import { Router } from "express";
import * as controller from "../controllers/price.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Owner requests a change
router.post(
    "/request",
    authenticate,
    authorize(["owner"]),
    controller.requestUpdate
);

// Regulator reviews a change
router.post(
    "/review",
    authenticate,
    authorize(["regulator", "admin"]),
    controller.reviewUpdate
);

// Public/Investor views history
router.get(
    "/history/:propertyId",
    controller.getHistory
);

export default router;
