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

const router = Router();

// Public Routes (No Auth Required)
router.post("/register", register);
router.post("/login", login);

export default router;
