import { Router } from "express";
/**
 * [MODULE] Auth Routes
 * --------------------
 * Purpose: Public endpoints for user authentication.
 * Connections:
 * - Frontend: Login/Register Forms (src/app/auth/*).
 * - Security: Generates JWT tokens for session management.
 */
import { register, login, verifyEmail, resendVerification } from "../controllers/auth.controller";
import { upload } from "../controllers/kyc.controller";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../schemas/validation.schemas";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public Routes (No Auth Required)
router.post(
    "/register",
    upload.fields([
        { name: "cnic_front", maxCount: 1 },
        { name: "cnic_back", maxCount: 1 },
        { name: "face_scan", maxCount: 1 },
    ]),
    validate(registerSchema),
    register
);
router.post("/login", validate(loginSchema), login);
router.get("/verify-email", verifyEmail);

// Protected Routes
router.post("/resend-verification", authenticate, resendVerification);

export default router;
