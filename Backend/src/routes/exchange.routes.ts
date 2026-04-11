import { Router } from "express";
import { createListing, getMarketplaceListings, executeTrade, updateListing, withdrawListing } from "../controllers/exchange.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Browse active listings (Any authenticated user)
router.get("/listings", authenticate, getMarketplaceListings);

// Create a new listing (Seller)
router.post("/listings", authenticate, createListing);

// Buy a listing (Buyer)
router.post("/listings/:id/buy", authenticate, executeTrade);

// Update active listing (Seller)
router.put("/listings/:id", authenticate, updateListing);

// Withdraw active listing (Seller)
router.delete("/listings/:id", authenticate, withdrawListing);

export default router;