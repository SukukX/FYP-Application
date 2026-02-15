import { Router } from "express";
import {
    createPartition,
    issueTokens,
    transferTokens,
    distributeProfit,
    getBalance,
    getPartitions,
    addWallet,
    whitelistInvestor,
    removeWallet
} from "../controllers/blockchain.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * [MODULE] Blockchain Routes
 * --------------------------
 * Bridges Off-Chain Database (Prisma) with On-Chain Smart Contract.
 */

// --- USER SETUP ---
router.post("/wallet", authenticate, addWallet);

// --- ASSET MANAGEMENT (Owner) ---
router.post(
    "/partition",
    authenticate,
    authorize(["owner"]),
    createPartition
);

router.post(
    "/issue",
    authenticate,
    authorize(["owner"]),
    issueTokens
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
    distributeProfit
);

// --- COMPLIANCE (Regulator) ---
router.post(
    "/whitelist",
    authenticate,
    // Allows both regulator and admin (your .env account) to whitelist
    authorize(["regulator", "admin"]),
    whitelistInvestor
);

// --- SECONDARY MARKET (All) ---
router.post(
    "/transfer",
    authenticate,
    authorize(["investor", "owner"]),
    transferTokens
);

router.delete(
    "/wallet",
    authenticate,
    removeWallet
);

// --- READ ACTIONS ---
router.get("/balance", authenticate, getBalance);
router.get("/partitions", authenticate, getPartitions);

export default router;