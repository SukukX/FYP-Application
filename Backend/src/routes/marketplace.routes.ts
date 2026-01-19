import { Router } from "express";
/**
 * [MODULE] Marketplace Routes
 * ---------------------------
 * Purpose: Public/Semi-public endpoints for viewing properties.
 * Connections:
 * - Frontend: Marketplace Feed (/marketplace) & Property Details (/marketplace/[id]).
 * - Consumers: Investors (Buying) & Guests (Browsing).
 */
import { getListings, getPropertyDetails } from "../controllers/marketplace.controller";

const router = Router();

// Public Listing Search
router.get("/", getListings);
// Detailed Property View (includes docs, history)
router.get("/:id", getPropertyDetails);

export default router;
