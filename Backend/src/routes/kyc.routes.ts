import { Router } from "express";
/**
 * [MODULE] KYC Routes
 * -------------------
 * Purpose: Identity Verification endpoints.
 * Connections:
 * - Frontend: Investor Dashboard (Upload Modal).
 * - Middleware: Uses 'Multer' for file handling (CNIC, Face Scan).
 */
import { submitKYC, getKYCStatus, upload } from "../controllers/kyc.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/submit",
    authenticate,
    // [MIDDLEWARE] Multer Upload
    // Expects: 'cnic_front', 'cnic_back', 'face_scan' (images).
    upload.fields([
        { name: "cnic_front", maxCount: 1 },
        { name: "cnic_back", maxCount: 1 },
        { name: "face_scan", maxCount: 1 },
    ]),
    submitKYC
);

router.get("/status", authenticate, getKYCStatus);

export default router;
