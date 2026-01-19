import { Router } from "express";
/**
 * [MODULE] MFA Routes
 * -------------------
 * Purpose: Multi-Factor Authentication management.
 * Flow: Generate Secret (QR) -> Verify Token (Enable) -> Disable.
 */
import { generateMfaSecret, verifyMfa, disableMfa } from "../controllers/mfa.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/generate", authenticate, generateMfaSecret);
router.post("/verify", authenticate, verifyMfa);
router.post("/disable", authenticate, disableMfa);

export default router;
