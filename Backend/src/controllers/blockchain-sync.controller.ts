import { Request, Response } from "express";
import * as blockchainService from "../services/blockchain.service";
import prisma from '../config/prisma';

import { AuthRequest } from "../middleware/auth.middleware";


/**
 * [DEV TOOL] Sync Blockchain with DB
 * Re-creates partitions for active sukuks if missing on local chain.
 */
export const syncBlockchain = async (req: AuthRequest, res: Response) => {
    try {
        const sukuks = await prisma.sukuk.findMany({
            where: { status: 'active' },
            include: { property: true }
        });

        const results = [];

        for (const sukuk of sukuks) {
            const ownerWallet = await prisma.wallet.findFirst({
                where: { user_id: sukuk.property.owner_id, is_primary: true }
            });

            if (ownerWallet) {
                const partitionName = `Sukuk_Asset_${sukuk.property_id}`;
                const success = await blockchainService.syncState(
                    partitionName,
                    ownerWallet.wallet_address,
                    sukuk.total_tokens.toString()
                );
                results.push({ partition: partitionName, success });
            } else {
                results.push({ partition: `Sukuk_Asset_${sukuk.property_id}`, success: false, reason: "No Owner Wallet" });
            }
        }

        // Re-whitelist all approved investors
        const approvedUsers = await prisma.kYCRequest.findMany({
            where: { status: 'approved' },
            include: {
                user: {
                    include: {
                        wallets: { where: { is_primary: true } }
                    }
                }
            }
        });

        let whitelistedCount = 0;

        for (const kyc of approvedUsers) {
            const wallet = kyc.user.wallets[0];

            if (wallet) {
                try {
                    await blockchainService.addToWhitelist(wallet.wallet_address);
                    whitelistedCount++;

                    // Small delay to prevent nonce conflicts
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error: any) {
                    // Ignore if already whitelisted
                    if (!error.message.includes("already whitelisted")) {
                        console.error(`Failed to whitelist ${kyc.user.name}:`, error.message);
                    } else {
                        whitelistedCount++;
                    }
                }
            }
        }

        res.json({
            message: "Sync complete",
            results,
            whitelisted: whitelistedCount
        });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: "Sync failed" });
    }
};
