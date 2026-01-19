import { Router } from "express";
/**
 * [MODULE] Settings Routes
 * ------------------------
 * Purpose: User Account Settings.
 * Connections:
 * - Frontend: /settings page.
 */
import { getSettings } from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getSettings);

export default router;
