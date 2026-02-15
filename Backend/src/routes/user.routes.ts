import { Router } from "express";
/**
 * [MODULE] User Routes
 * --------------------
 * Purpose: Personal user data management.
 * Connections:
 * - Consumers: Settings Page, Navigation Bar (Avatar/Name).
 * - Middleware: All routes require 'authenticate' (Login).
 */
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    connectWallet,
    disconnectWallet,
    // Security Routes
    generateMFASetup,
    verifyMFASetup,
    toggleMFA
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../controllers/kyc.controller"; // Reusing upload config

const router = Router();

router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.post("/profile/avatar", authenticate, upload.single("profile_pic"), uploadAvatar);

// Security Routes
router.put("/password", authenticate, changePassword);
// MFA Routes
router.post("/mfa/setup", authenticate, generateMFASetup);
router.post("/mfa/verify", authenticate, verifyMFASetup);
router.put("/mfa", authenticate, toggleMFA); // For disabling only

// Wallet Routes
router.post("/wallet", authenticate, connectWallet);
router.delete("/wallet/:walletAddress", authenticate, disconnectWallet);

export default router;
