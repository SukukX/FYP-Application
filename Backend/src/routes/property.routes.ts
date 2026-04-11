import { Router } from "express";
/**
 * [MODULE] Property Routes
 * ------------------------
 * Purpose: Defines all API endpoints related to real estate assets.
 * Connections:
 * - Frontend: Used by Owner Dashboard (creation/management) and Regulator Dashboard (verification).
 * - Middleware: Protected by Authenticate (JWT) and Authorize (Role-based).
 */
import {
    createProperty,
    uploadDocuments,
    submitForVerification,
    getMyProperties,
    verifyProperty,
    uploadPropertyDocs,
    updateListingStatus,
    deleteProperty,
    updateTokenSupply,
    revalueProperty
} from "../controllers/property.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// Owner Routes (Protected: 'user' role)
// Consumers: Frontend/src/app/dashboard/user (Owner features)
// ==========================================
router.post("/", authenticate, authorize(["user"]), uploadPropertyDocs.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]), createProperty);
router.post("/:id/documents", authenticate, authorize(["user"]), uploadPropertyDocs.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]), uploadDocuments);
router.post("/:id/submit", authenticate, authorize(["user"]), uploadPropertyDocs.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]), submitForVerification);
router.patch("/:id/status", authenticate, authorize(["user"]), updateListingStatus);
router.patch("/:id/supply", authenticate, authorize(["user"]), updateTokenSupply);
router.delete("/:id", authenticate, authorize(["user"]), deleteProperty);
router.get("/my", authenticate, authorize(["user"]), getMyProperties);

// ==========================================
// Regulator Routes (Protected: 'regulator', 'admin')
// Consumers: Frontend/src/app/dashboard/regulator
// ==========================================
router.patch("/:id/verify", authenticate, authorize(["regulator", "admin"]), uploadPropertyDocs.single('proof'), verifyProperty);
router.post("/:id/revalue", authenticate, authorize(["regulator", "admin"]), revalueProperty);

export default router;
