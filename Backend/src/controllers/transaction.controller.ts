import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import * as blockchainService from "../services/blockchain.service";

const prisma = new PrismaClient();

const getPartitionName = (propertyId: number) => `Sukuk_Asset_${propertyId}`;

export const buyTokens = async (req: AuthRequest, res: Response) => {
    try {
        const { propertyId, amount } = req.body;
        const investorId = req.user?.user_id;

        if (!investorId) return res.status(401).json({ message: "Unauthorized" });

        // 1. Fetch Property and Sukuk
        const property = await prisma.property.findUnique({
            where: { property_id: Number(propertyId) },
            include: { sukuks: true, owner: true }
        });

        if (!property) return res.status(404).json({ message: "Property not found" });
        const sukuk = property.sukuks[0];
        if (!sukuk) return res.status(404).json({ message: "Sukuk not found" });

        // 2. Validate Supply
        if (amount > sukuk.available_tokens) {
            return res.status(400).json({ message: `Only ${sukuk.available_tokens} tokens available` });
        }

        // 3. Get Wallets
        const investorWallet = await prisma.wallet.findFirst({
            where: { user_id: investorId, is_primary: true }
        });
        if (!investorWallet) return res.status(400).json({ message: "Please connect your wallet first" });

        const ownerWallet = await prisma.wallet.findFirst({
            where: { user_id: property.owner_id, is_primary: true }
        });
        if (!ownerWallet) return res.status(500).json({ message: "Owner wallet not configured" });

        // 4. Calculate Price
        const totalPrice = Number(sukuk.token_price) * amount;

        console.log(`[BUY] Investor ${investorId} buying ${amount} tokens of Property ${propertyId}`);

        // 5. Blockchain Transfer (Owner -> Investor)
        // Using Operator Transfer (Server signs)
        const partitionName = getPartitionName(property.property_id);
        const txHash = await blockchainService.transferTokens(
            partitionName,
            ownerWallet.wallet_address,
            investorWallet.wallet_address,
            amount.toString()
        );

        // 6. DB Sync
        await prisma.$transaction(async (tx) => {
            // Decrement Owner Inventory
            const ownerInv = await tx.investment.findFirst({
                where: { investor_id: property.owner_id, sukuk_id: sukuk.sukuk_id }
            });

            if (ownerInv) {
                await tx.investment.update({
                    where: { investment_id: ownerInv.investment_id },
                    data: { tokens_owned: { decrement: amount } }
                });
            }

            // Upsert Investor Inventory
            const investorInv = await tx.investment.findFirst({
                where: { investor_id: investorId, sukuk_id: sukuk.sukuk_id }
            });

            if (investorInv) {
                await tx.investment.update({
                    where: { investment_id: investorInv.investment_id },
                    data: {
                        tokens_owned: { increment: amount },
                        purchase_value: { increment: totalPrice }
                    }
                });
            } else {
                await tx.investment.create({
                    data: {
                        investor_id: investorId,
                        sukuk_id: sukuk.sukuk_id,
                        tokens_owned: amount,
                        purchase_value: totalPrice,
                        tx_hash: txHash
                    }
                });
            }

            // Decrement Available Supply
            await tx.sukuk.update({
                where: { sukuk_id: sukuk.sukuk_id },
                data: { available_tokens: { decrement: amount } }
            });

            // Log Transaction
            await tx.transactionLog.create({
                data: {
                    user_id: investorId,
                    sukuk_id: sukuk.sukuk_id,
                    type: 'buy',
                    amount: totalPrice,
                    tx_hash: txHash,
                    status: 'success'
                }
            });

            // Notify Owner
            await tx.notification.create({
                data: {
                    user_id: property.owner_id,
                    type: "transaction",
                    message: `${amount} tokens of '${property.title}' were sold for PKR ${totalPrice}`
                }
            });
        });

        res.json({ message: "Tokens purchased successfully", txHash });

    } catch (error: any) {
        console.error("Buy Tokens Error:", error);
        res.status(500).json({ message: "Purchase failed", error: error.message });
    }
};
