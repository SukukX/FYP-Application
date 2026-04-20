import { Router } from "express";
/**
 * [MODULE] Auth Routes
 * --------------------
 * Purpose: Public endpoints for user authentication.
 * Connections:
 * - Frontend: Login/Register Forms (src/app/auth/*).
 * - Security: Generates JWT tokens for session management.
 */
import { register, login } from "../controllers/auth.controller";
import { upload } from "../controllers/kyc.controller";

const router = Router();

// Public Routes (No Auth Required)
router.post(
    "/register",
    upload.fields([
        { name: "cnic_front", maxCount: 1 },
        { name: "cnic_back", maxCount: 1 },
        { name: "face_scan", maxCount: 1 },
    ]),
    register
);
router.post("/login", login);

export default router;
