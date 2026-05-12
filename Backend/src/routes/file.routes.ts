import { Router } from "express";
import { getSecureFile } from "../controllers/file.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Endpoint for accessing secure files via Cloudinary signed URLs
router.get("/secure", authenticate, getSecureFile);

export default router;
