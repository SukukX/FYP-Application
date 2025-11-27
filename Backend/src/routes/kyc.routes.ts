import { Router } from "express";
import { submitKYC, getKYCStatus, upload } from "../controllers/kyc.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/submit",
    authenticate,
    upload.fields([
        { name: "cnic_front", maxCount: 1 },
        { name: "cnic_back", maxCount: 1 },
        { name: "face_scan", maxCount: 1 },
    ]),
    submitKYC
);

router.get("/status", authenticate, getKYCStatus);

export default router;
