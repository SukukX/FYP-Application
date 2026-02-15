import { Router } from "express";
import { buyTokens } from "../controllers/transaction.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/buy",
    authenticate,
    authorize(["investor"]),
    buyTokens
);

export default router;
