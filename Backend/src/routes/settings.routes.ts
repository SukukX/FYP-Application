import { Router } from "express";
import { getSettings } from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getSettings);

export default router;
