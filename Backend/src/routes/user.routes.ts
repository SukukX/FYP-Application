import { Router } from "express";
/**
 * [MODULE] User Routes
 * --------------------
 * Purpose: Personal user data management.
 * Connections:
 * - Consumers: Settings Page, Navigation Bar (Avatar/Name).
 * - Middleware: All routes require 'authenticate' (Login).
 */
import { getProfile, updateProfile } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);

export default router;
