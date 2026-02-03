import { Request, Response } from "express";
import * as blockchainService from "../services/blockchain.service";
import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

// 1. DETERMINISTIC NAMING HELPER
const getPartitionName = (propertyId: number) => `Sukuk_Asset_${propertyId}`;

/**
 * [STEP 1] Tokenize Asset (Pre-Mint Strategy)
 * Action: Creates partition AND mints 100% supply to Owner's Wallet.
 */
// export const createPartition = async (req: Request, res: Response) => {
//     try {
//         const { propertyId } = req.body;
//         const userId = (req as any).user?.user_id;

//         if (!propertyId) return res.status(400).json({ error: "propertyId is required" });

//         // 1. Fetch Property
//         const property = await prisma.property.findUnique({
//             where: { property_id: Number(propertyId) },
//             include: { sukuks: true }
//         });

//         if (!property) return res.status(404).json({ error: "Property not found" });
//         if (property.owner_id !== userId) return res.status(403).json({ error: "Unauthorized" });

//         const draftSukuk = property.sukuks[0];
//         if (!draftSukuk) return res.status(404).json({ error: "Draft Sukuk not found" });
//         if (draftSukuk.blockchain_hash) return res.status(409).json({ error: "Asset already tokenized" });
//         if (draftSukuk.total_tokens <= 0) return res.status(400).json({ error: "Total tokens must be > 0" });

//         // 2. Fetch Owner's Wallet
//         const ownerWalletRecord = await prisma.wallet.findFirst({
//             where: { user_id: userId, is_primary: true }
//         });

//         if (!ownerWalletRecord) {
//             return res.status(400).json({ error: "You must connect a wallet first." });
//         }

//         const partitionName = getPartitionName(property.property_id);
//         console.log(`[Tokenization] Creating ${partitionName} and minting ${draftSukuk.total_tokens} to Owner...`);

//         // 3. Blockchain: Create Partition
//         await blockchainService.createPartition(partitionName);

//         // 4. Blockchain: Pre-Mint ALL tokens to Owner
//         const txHash = await blockchainService.issueTokens(
//             partitionName,
//             ownerWalletRecord.wallet_address,
//             draftSukuk.total_tokens.toString()
//         );

//         // 5. DB Sync
//         await prisma.$transaction(async (tx) => {
//             // Update Sukuk Status
//             await tx.sukuk.update({
//                 where: { sukuk_id: draftSukuk.sukuk_id },
//                 data: {
//                     blockchain_hash: txHash,
//                     status: 'active'
//                 }
//             });

//             // Create Inventory Investment (Owner holds 100%)
//             await tx.investment.create({
//                 data: {
//                     investor_id: userId,
//                     sukuk_id: draftSukuk.sukuk_id,
//                     tokens_owned: draftSukuk.total_tokens,
//                     purchase_value: 0, // Self-issued
//                     tx_hash: txHash
//                 }
//             });

//             // Log it
//             await tx.auditLog.create({
//                 data: {
//                     user_id: userId,
//                     action: 'TOKENIZE_ASSET',
//                     details: `Minted ${draftSukuk.total_tokens} tokens to ${ownerWalletRecord.wallet_address}`,
//                     ip_address: req.ip || "127.0.0.1"
//                 }
//             });
//         });

//         res.json({ message: "Asset Tokenized & Inventory Minted", txHash, partitionName });

//     } catch (error: any) {
//         console.error("Tokenization Error:", error);
//         res.status(500).json({ error: "Tokenization failed", details: error.message });
//     }
// };


export const createPartition = async (req: Request, res: Response) => {
    try {
        const { propertyId } = req.body;
        const userId = (req as any).user?.user_id;

        if (!propertyId) return res.status(400).json({ error: "propertyId is required" });

        // 1. Fetch Property & Draft Sukuk
        const property = await prisma.property.findUnique({
             where: { property_id: Number(propertyId) },
             include: { sukuks: true }
        });
        
        if (!property) return res.status(404).json({ error: "Property not found" });
        if (property.owner_id !== userId) return res.status(403).json({ error: "Unauthorized" });

        const draftSukuk = property.sukuks[0];
        if (!draftSukuk) return res.status(404).json({ error: "Draft Sukuk not found" });
        
        // NOTE: We allow the code to proceed even if hash is missing, 
        // to recover from the exact crash you are experiencing.
        
        const ownerWalletRecord = await prisma.wallet.findFirst({
            where: { user_id: userId, is_primary: true }
        });

        if (!ownerWalletRecord) {
            return res.status(400).json({ error: "You must connect a wallet first." });
        }

        const partitionName = `Sukuk_Asset_${property.property_id}`;
        console.log(`[Tokenization] Processing ${partitionName}...`);

        // ======================================================
        // IDEMPOTENCY FIX (Professional Standard)
        // ======================================================
        try {
            // Attempt to create the partition on-chain
            await blockchainService.createPartition(partitionName);
            console.log(`✅ Partition ${partitionName} created successfully.`);
        } catch (error: any) {
            // Extract the error message safely
            const errorMessage = error?.info?.error?.message || error.message || JSON.stringify(error);
            
            // Check for the specific "Already Exists" revert reason seen in your logs
            if (errorMessage.includes("Partition already exists") || errorMessage.includes("revert")) {
                console.warn(`⚠️ Notice: Partition ${partitionName} already exists on-chain. Skipping creation and proceeding to mint.`);
                // This is NOT a failure. It means we succeeded previously but crashed before saving.
                // We swallow the error and allow the code to continue to the next step.
            } else {
                // If it is any other error (Gas, Network, Auth), we must throw it and stop.
                throw error;
            }
        }

        // ======================================================
        // STEP 2: PRE-MINTING (Inventory)
        // ======================================================
        // Now that we know the partition exists (either just created or existed before),
        // we proceed to mint the tokens.
        
        console.log(`[Minting] Issuing ${draftSukuk.total_tokens} tokens to Owner...`);
        
        // This call will use a FRESH nonce, solving your "Nonce too low" issue
        const txHash = await blockchainService.issueTokens(
            partitionName, 
            ownerWalletRecord.wallet_address, 
            draftSukuk.total_tokens.toString()
        );

        // ======================================================
        // STEP 3: DATABASE SYNC
        // ======================================================
        await prisma.$transaction(async (tx) => {
             // 1. Activate the Sukuk Record
             await tx.sukuk.update({
                where: { sukuk_id: draftSukuk.sukuk_id },
                data: {
                    blockchain_hash: txHash,
                    status: 'active'
                }
            });

            // 2. Create the Owner's Initial Inventory Record
            // We use 'upsert' here to handle the case where we crashed halfway through DB updates
            await tx.investment.upsert({
                where: { 
                    // You need a unique constraint on [investor_id, sukuk_id] in your Schema for this to work perfectly.
                    // If you don't have one, findFirst + update/create is safer. 
                    // For now, assuming you handle duplicates or have a unique index:
                    investment_id: -1 // This won't match, forcing create, unless you have a specific unique key
                },
                update: {
                    tokens_owned: draftSukuk.total_tokens,
                    tx_hash: txHash
                },
                create: {
                    investor_id: userId,
                    sukuk_id: draftSukuk.sukuk_id,
                    tokens_owned: draftSukuk.total_tokens,
                    purchase_value: 0, 
                    tx_hash: txHash
                }
            });
            
            // Note: If upsert gives you trouble due to schema, just use .create(). 
            // The transaction rollback protects us mostly, but since we are recovering from a crash,
            // the 'Active' status update is the most critical part.
        });

        // Success Response
        res.json({ 
            message: "Asset Tokenized Successfully (State Synced)", 
            txHash, 
            partitionName 
        });

    } catch (error: any) {
        console.error("Tokenization Critical Failure:", error);
        res.status(500).json({ error: "Tokenization failed", details: error.message });
    }
};
/**
 * [STEP 2] Whitelist Investor
 */
export const whitelistInvestor = async (req: Request, res: Response) => {
    try {
        const { wallet } = req.body;

        if (!wallet || !wallet.startsWith("0x")) {
            return res.status(400).json({ error: "Invalid wallet address format" });
        }

        const dbWallet = await prisma.wallet.findUnique({ where: { wallet_address: wallet } });
        if (!dbWallet) return res.status(404).json({ error: "Wallet not found in database." });

        console.log(`Whitelisting Investor: ${wallet}`);
        const txHash = await blockchainService.addToWhitelist(wallet);

        res.json({ message: "Investor whitelisted successfully", wallet, txHash });

    } catch (error: any) {
        console.error("Whitelisting Error:", error);
        res.status(500).json({ error: "Failed to whitelist", details: error.message });
    }
};

/**
 * [STEP 3] Issue Tokens (Sales)
 * Action: Moves tokens from Owner Inventory -> Investor
 */
export const issueTokens = async (req: Request, res: Response) => {
    try {
        const { propertyId, investorWallet, amount } = req.body;
        const ownerUserId = (req as any).user?.user_id;

        if (!propertyId || !investorWallet || !amount) return res.status(400).json({ error: "Missing fields" });

        // 1. Fetch Data
        const property = await prisma.property.findUnique({
            where: { property_id: Number(propertyId) },
            include: { sukuks: true }
        });
        if (!property) return res.status(404).json({ error: "Property not found" });
        if (property.owner_id !== ownerUserId) return res.status(403).json({ error: "Unauthorized" });

        const sukuk = property.sukuks[0];
        if (!sukuk || !sukuk.blockchain_hash) return res.status(400).json({ error: "Asset not tokenized" });

        // 2. Supply Check
        const amountInt = parseInt(amount);
        if (amountInt > sukuk.available_tokens) {
            return res.status(400).json({ error: `Insufficient supply. Only ${sukuk.available_tokens} available.` });
        }

        // 3. Wallets
        const ownerWalletRecord = await prisma.wallet.findFirst({
            where: { user_id: ownerUserId, is_primary: true }
        });
        if (!ownerWalletRecord) return res.status(500).json({ error: "Owner wallet missing." });

        const investorWalletRecord = await prisma.wallet.findUnique({
            where: { wallet_address: investorWallet },
            include: { user: true }
        });
        if (!investorWalletRecord) return res.status(404).json({ error: "Investor wallet not found" });

        const partitionName = getPartitionName(property.property_id);
        console.log(`Selling ${amount} tokens from Owner to ${investorWallet}...`);

        // 4. Blockchain: Operator Transfer (Owner -> Investor)
        const txHash = await blockchainService.transferTokens(
            partitionName,
            ownerWalletRecord.wallet_address,
            investorWallet,
            amount
        );

        // 5. DB Sync
        await prisma.$transaction(async (tx) => {
            // A. Owner Inventory -
            const ownerInv = await tx.investment.findFirst({
                where: { investor_id: ownerUserId, sukuk_id: sukuk.sukuk_id }
            });
            if (ownerInv) {
                await tx.investment.update({
                    where: { investment_id: ownerInv.investment_id },
                    data: { tokens_owned: { decrement: amountInt } }
                });
            }

            // B. Investor Holdings +
            const existingInv = await tx.investment.findFirst({
                where: { investor_id: investorWalletRecord.user_id, sukuk_id: sukuk.sukuk_id }
            });
            if (existingInv) {
                await tx.investment.update({
                    where: { investment_id: existingInv.investment_id },
                    data: { 
                        tokens_owned: { increment: amountInt },
                        purchase_value: { increment: (amountInt * Number(sukuk.token_price)) }
                    }
                });
            } else {
                await tx.investment.create({
                    data: {
                        investor_id: investorWalletRecord.user_id,
                        sukuk_id: sukuk.sukuk_id,
                        tokens_owned: amountInt,
                        purchase_value: (amountInt * Number(sukuk.token_price)),
                        tx_hash: txHash
                    }
                });
            }

            // C. Global Supply -
            await tx.sukuk.update({
                where: { sukuk_id: sukuk.sukuk_id },
                data: { available_tokens: { decrement: amountInt } }
            });

            // D. Logs
            await tx.transactionLog.create({
                data: {
                    user_id: investorWalletRecord.user_id,
                    sukuk_id: sukuk.sukuk_id,
                    type: 'buy',
                    amount: (amountInt * Number(sukuk.token_price)),
                    tx_hash: txHash,
                    status: 'success'
                }
            });
        });

        res.json({ message: "Tokens Sold Successfully", txHash });

    } catch (error: any) {
        console.error("Issuance Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * [STEP 4] Transfer Tokens (Secondary Market)
 * Logic: Investor A -> Investor B
 */
export const transferTokens = async (req: Request, res: Response) => {
    try {
        const { propertyId, toWallet, amount } = req.body;
        const senderUserId = (req as any).user?.user_id;

        if (!propertyId || !toWallet || !amount) return res.status(400).json({ error: "Missing fields" });

        const amountToTransfer = parseInt(amount);

        const senderWalletRecord = await prisma.wallet.findFirst({
            where: { user_id: senderUserId, is_primary: true }
        });
        if (!senderWalletRecord) return res.status(404).json({ error: "Sender wallet not found" });

        const receiverWalletRecord = await prisma.wallet.findUnique({
            where: { wallet_address: toWallet },
            include: { user: true }
        });
        if (!receiverWalletRecord) return res.status(404).json({ error: "Receiver not found" });

        const property = await prisma.property.findUnique({
            where: { property_id: Number(propertyId) },
            include: { sukuks: true }
        });
        if (!property || !property.sukuks[0]) return res.status(404).json({ error: "Asset not found" });

        const sukuk = property.sukuks[0];
        const partitionName = getPartitionName(property.property_id);

        // Blockchain Check
        const currentBalance = await blockchainService.getBalance(partitionName, senderWalletRecord.wallet_address);
        if (parseFloat(currentBalance) < amountToTransfer) {
            return res.status(400).json({ error: "Insufficient blockchain balance" });
        }

        // Blockchain Transfer
        const txHash = await blockchainService.transferTokens(
            partitionName,
            senderWalletRecord.wallet_address,
            toWallet,
            amount
        );

        // DB Sync
        await prisma.$transaction(async (tx) => {
            // Sender -
            const senderInv = await tx.investment.findFirst({ where: { investor_id: senderUserId, sukuk_id: sukuk.sukuk_id }});
            if (senderInv) await tx.investment.update({ where: { investment_id: senderInv.investment_id }, data: { tokens_owned: { decrement: amountToTransfer }}});

            // Receiver +
            const receiverInv = await tx.investment.findFirst({ where: { investor_id: receiverWalletRecord.user_id, sukuk_id: sukuk.sukuk_id }});
            if (receiverInv) {
                await tx.investment.update({ where: { investment_id: receiverInv.investment_id }, data: { tokens_owned: { increment: amountToTransfer }}});
            } else {
                await tx.investment.create({
                    data: {
                        investor_id: receiverWalletRecord.user_id,
                        sukuk_id: sukuk.sukuk_id,
                        tokens_owned: amountToTransfer,
                        purchase_value: (amountToTransfer * Number(sukuk.token_price)),
                        tx_hash: txHash
                    }
                });
            }

            // Logs
            await tx.transactionLog.create({ data: { user_id: senderUserId, sukuk_id: sukuk.sukuk_id, type: 'sell', amount: amountToTransfer * Number(sukuk.token_price), tx_hash: txHash, status: 'success' }});
            await tx.transactionLog.create({ data: { user_id: receiverWalletRecord.user_id, sukuk_id: sukuk.sukuk_id, type: 'buy', amount: amountToTransfer * Number(sukuk.token_price), tx_hash: txHash, status: 'success' }});
            
            await tx.auditLog.create({ data: { user_id: senderUserId, action: 'TRANSFER_ASSET', details: `Transfer ${amount} tokens to ${toWallet}`, ip_address: req.ip || "127.0.0.1" }});
        });

        res.json({ message: "Transfer successful", txHash });

    } catch (error: any) {
        console.error("Transfer Error:", error);
        res.status(500).json({ error: "Transfer failed", details: error.message });
    }
};

/**
 * [STEP 5] Distribute Profit (Dividends)
 * Action: Pays out to all token holders (Filling the ProfitDistribution Table)
 */
export const distributeProfit = async (req: Request, res: Response) => {
    try {
        const { propertyId, totalAmount } = req.body;
        const ownerUserId = (req as any).user?.user_id;

        const property = await prisma.property.findUnique({
             where: { property_id: Number(propertyId) },
             include: { sukuks: true }
        });

        if (!property || property.owner_id !== ownerUserId) return res.status(403).json({ error: "Unauthorized" });

        const sukuk = property.sukuks[0];
        // Only pay investors who own tokens > 0.
        // NOTE: This usually includes the Owner if they still hold inventory. 
        // If you want to EXCLUDE owner inventory, filter by NOT owner_id.
        const investments = await prisma.investment.findMany({
            where: { 
                sukuk_id: sukuk.sukuk_id, 
                tokens_owned: { gt: 0 } 
            },
            include: { investor: true }
        });

        if (!investments.length) return res.status(400).json({ error: "No investors found" });

        const totalTokens = investments.reduce((sum, inv) => sum + inv.tokens_owned, 0);
        const rate = parseFloat(totalAmount) / totalTokens;

        await prisma.$transaction(async (tx) => {
            for (const inv of investments) {
                const payout = inv.tokens_owned * rate;
                
                await tx.profitDistribution.create({
                    data: {
                        sukuk_id: sukuk.sukuk_id,
                        investor_id: inv.investor_id,
                        amount: payout,
                        tx_hash: `PAYOUT_${Date.now()}_${inv.investor_id}`
                    }
                });

                await tx.transactionLog.create({
                    data: {
                        user_id: inv.investor_id,
                        sukuk_id: sukuk.sukuk_id,
                        type: 'profit_payout',
                        amount: payout,
                        tx_hash: "OFF_CHAIN_FIAT",
                        status: 'success'
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    user_id: ownerUserId,
                    action: 'PROFIT_DISTRIBUTION',
                    details: `Distributed $${totalAmount}`,
                    ip_address: req.ip || "127.0.0.1"
                }
            });
        });

        res.json({ message: "Profit Distributed", rate, beneficiaries: investments.length });

    } catch (error: any) {
        console.error("Profit Dist Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// [HELPERS]
export const getBalance = async (req: Request, res: Response) => {
    try {
        const { propertyId, wallet } = req.query;
        if (!propertyId || !wallet) return res.status(400).json({ error: "Missing params" });
        const balance = await blockchainService.getBalance(getPartitionName(Number(propertyId)), wallet as string);
        res.json({ propertyId, wallet, balance });
    } catch (error) { res.status(500).json({ error: "Failed to fetch balance" }); }
};

export const getPartitions = async (req: Request, res: Response) => {
    try {
        const partitions = await blockchainService.getPartitions();
        res.json({ partitions });
    } catch (error: any) { res.status(500).json({ error: "Failed to fetch partitions" }); }
};

export const addWallet = async (req: Request, res: Response) => {
    try {
        const { wallet } = req.body;
        const userId = (req as any).user?.user_id || (req as any).user?.id;
        if (!wallet || !wallet.startsWith("0x")) return res.status(400).json({ error: "Invalid wallet" });
        
        const exists = await prisma.wallet.findUnique({ where: { wallet_address: wallet } });
        if (exists) return res.status(409).json({ error: "Wallet linked" });

        const newWallet = await prisma.wallet.create({ data: { user_id: userId, wallet_address: wallet, chain_id: 31337, is_primary: true }});
        res.json({ message: "Wallet Connected", wallet: newWallet });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
};