import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import * as blockchainService from "../services/blockchain.service";

const prisma = new PrismaClient();

/**
 * 1. CREATE A LISTING (Seller Action)
 * Ahmed wants to sell a bundle of tokens.
 */

export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user?.user_id;
        const { sukuk_id, token_amount, total_asking_price } = req.body;

        if (!sellerId) return res.status(401).json({ message: "Unauthorized" });

        // VULNERABILITY PATCH 2: KYC Check
        const kyc = await prisma.kYCRequest.findUnique({ where: { user_id: sellerId } });
        if (kyc?.status !== "approved") {
            return res.status(403).json({ message: "You must be KYC Verified to trade on the secondary market." });
        }

        // 1. Verify the seller actually owns these tokens
        const investment = await prisma.investment.findFirst({
            where: { investor_id: sellerId, sukuk_id: parseInt(sukuk_id) }
        });

        if (!investment) {
            return res.status(400).json({ message: "You do not own any tokens in this property." });
        }

        // VULNERABILITY PATCH 1: The "Double-List" Exploit
        const activeListings = await prisma.secondaryListing.findMany({
            where: { seller_id: sellerId, sukuk_id: parseInt(sukuk_id), status: "open" }
        });
        
        const lockedTokens = activeListings.reduce((sum, listing) => sum + listing.token_amount, 0);
        const availableTokensToList = investment.tokens_owned - lockedTokens;

        if (availableTokensToList < parseInt(token_amount)) {
            return res.status(400).json({ 
                message: `You only have ${availableTokensToList} unlocked tokens available to list.` 
            });
        }

        // 2. Create the Secondary Listing
        const listing = await prisma.secondaryListing.create({
            data: {
                seller_id: sellerId,
                sukuk_id: parseInt(sukuk_id),
                token_amount: parseInt(token_amount),
                total_asking_price: parseFloat(total_asking_price),
                status: "open"
            }
        });

        res.status(201).json({ message: "Tokens successfully listed on the secondary market!", listing });
    } catch (error: any) {
        console.error("Create Listing Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
/**
 * 2. GET ALL OPEN LISTINGS (Marketplace View)
 * Fetches all active classified ads for the UI.
 */
export const getMarketplaceListings = async (req: AuthRequest, res: Response) => {
    try {
        const listings = await prisma.secondaryListing.findMany({
            where: { status: "open" },
            include: {
                sukuk: {
                    include: {
                        property: {
                            include: { documents: true } // Pull images for the UI cards
                        }
                    }
                },
                seller: {
                    select: { name: true } // Just get the seller's name to show "Listed by Ahmed"
                }
            },
            orderBy: { created_at: "desc" }
        });

        res.json(listings);
    } catch (error: any) {
        console.error("Get Listings Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * 3. EXECUTE TRADE (Buyer Action & Blockchain Swap)
 * Another investor buys Ahmed's bundle.
 */
export const executeTrade = async (req: AuthRequest, res: Response) => {
    try {
        const buyerId = req.user?.user_id;
        const listingId = parseInt(req.params.id);

        if (!buyerId) return res.status(401).json({ message: "Unauthorized" });

        // 1. Fetch the listing
        const listing = await prisma.secondaryListing.findUnique({
            where: { listing_id: listingId },
            include: { sukuk: { include: { property: true } } }
        });

        if (!listing || listing.status !== "open") {
            return res.status(404).json({ message: "Listing is no longer available." });
        }

        if (listing.seller_id === buyerId) {
            return res.status(400).json({ message: "You cannot buy your own listing." });
        }
        
        const kyc = await prisma.kYCRequest.findUnique({ where: { user_id: buyerId } });
        if (kyc?.status !== "approved") {
            return res.status(403).json({ message: "You must be KYC Verified to trade on the secondary market." });
        }

        // 2. Get Wallets for the Blockchain Transfer
        const sellerWallet = await prisma.wallet.findFirst({ where: { user_id: listing.seller_id, is_primary: true } });
        const buyerWallet = await prisma.wallet.findFirst({ where: { user_id: buyerId, is_primary: true } });

        if (!sellerWallet || !buyerWallet) {
            return res.status(400).json({ message: "Both buyer and seller must have connected wallets." });
        }

        const partitionName = `Sukuk_Asset_${listing.sukuk.property_id}`;

        // ======================================================
        // 3. THE BLOCKCHAIN SWAP
        // ======================================================
        let txHash;
        try {
            txHash = await blockchainService.transferTokens(
                partitionName,
                sellerWallet.wallet_address,
                buyerWallet.wallet_address,
                listing.token_amount.toString()
            );
        } catch (chainError: any) {
            console.error("Blockchain Transfer Failed:", chainError);
            return res.status(500).json({ message: "Blockchain transfer failed.", error: chainError.message });
        }

        // ======================================================
        // 4. DATABASE UPDATES (Transaction)
        // ======================================================
        await prisma.$transaction(async (tx) => {
            // A. Mark listing as completed
            await tx.secondaryListing.update({
                where: { listing_id: listingId },
                data: { status: "completed" }
            });

            // B. Deduct tokens from Seller
            const sellerInvestment = await tx.investment.findFirst({
                where: { investor_id: listing.seller_id, sukuk_id: listing.sukuk_id }
            });
            if (sellerInvestment) {
                await tx.investment.update({
                    where: { investment_id: sellerInvestment.investment_id },
                    data: { tokens_owned: sellerInvestment.tokens_owned - listing.token_amount }
                });
            }

            // C. Add tokens to Buyer (Update existing or create new)
            const buyerInvestment = await tx.investment.findFirst({
                where: { investor_id: buyerId, sukuk_id: listing.sukuk_id }
            });

            if (buyerInvestment) {
                await tx.investment.update({
                    where: { investment_id: buyerInvestment.investment_id },
                    data: { tokens_owned: buyerInvestment.tokens_owned + listing.token_amount }
                });
            } else {
                await tx.investment.create({
                    data: {
                        investor_id: buyerId,
                        sukuk_id: listing.sukuk_id,
                        tokens_owned: listing.token_amount,
                        purchase_value: listing.total_asking_price,
                        tx_hash: txHash
                    }
                });
            }
            
            // D. Log the transaction
            await tx.transactionLog.create({
                data: {
                    user_id: buyerId,
                    type: "buy", // Assuming 'buy' is a valid enum in your TransactionType
                    amount: listing.total_asking_price,
                    status: "success",
                    tx_hash: txHash
                }
            });
        }, { timeout: 20000 }); // Added the 20-second timeout we learned from earlier!

        res.json({ message: "Trade executed successfully!", txHash });
    } catch (error: any) {
        console.error("Execute Trade Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};