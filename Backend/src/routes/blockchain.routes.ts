import { Router } from "express";
import * as controller from "../controllers/blockchain.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * [MODULE] Blockchain Routes
 * --------------------------
 * Bridges Off-Chain Database (Prisma) with On-Chain Smart Contract.
 */

// --- USER SETUP ---
router.post("/wallet", authenticate, controller.addWallet);

// --- ASSET MANAGEMENT (Owner) ---
router.post(
    "/partition",
    authenticate,
    authorize(["owner"]),
    controller.createPartition
);

router.post(
    "/issue",
    authenticate,
    authorize(["owner"]),
    controller.issueTokens
);

/**
 * [ADDED THIS MISSING ROUTE]
 * Route: POST /api/blockchain/payout
 * Action: Distributes Rent/Profit to all current token holders.
 */
router.post(
    "/payout",
    authenticate,
    authorize(["owner"]),
    controller.distributeProfit
);

// --- COMPLIANCE (Regulator) ---
router.post(
    "/whitelist",
    authenticate,
    // Allows both regulator and admin (your .env account) to whitelist
    authorize(["regulator", "admin"]), 
    controller.whitelistInvestor
);

// --- SECONDARY MARKET (All) ---
router.post(
    "/transfer",
    authenticate,
    authorize(["investor", "owner"]),
    controller.transferTokens
);

// --- READ ACTIONS ---
router.get("/balance", authenticate, controller.getBalance);
router.get("/partitions", authenticate, controller.getPartitions);

export default router;