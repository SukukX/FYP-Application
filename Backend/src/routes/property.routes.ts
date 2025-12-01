import { Router } from "express";
import {
    createProperty,
    uploadDocuments,
    submitForVerification,
    getMyProperties,
    verifyProperty,
    uploadPropertyDocs,
    updateListingStatus,
    deleteProperty,
    updateTokenSupply
} from "../controllers/property.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Owner Routes
router.post("/", authenticate, authorize(["owner"]), uploadPropertyDocs.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]), createProperty);
router.post("/:id/documents", authenticate, authorize(["owner"]), uploadPropertyDocs.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]), uploadDocuments);
router.post("/:id/submit", authenticate, authorize(["owner"]), submitForVerification);
router.patch("/:id/status", authenticate, authorize(["owner"]), updateListingStatus);
router.patch("/:id/supply", authenticate, authorize(["owner"]), updateTokenSupply);
router.delete("/:id", authenticate, authorize(["owner"]), deleteProperty);
router.get("/my", authenticate, authorize(["owner"]), getMyProperties);

// Regulator Routes
router.patch("/:id/verify", authenticate, authorize(["regulator", "admin"]), verifyProperty);

export default router;
