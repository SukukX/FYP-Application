import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import * as blockchainService from "../services/blockchain.service";

const prisma = new PrismaClient();

/**
 * 1. CREATE A LISTING (Seller Action)
 * Seller lists a pool of tokens at a specific price per token.
 */
export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user?.user_id;
        const { sukuk_id, token_amount, price_per_token, days_valid = 30 } = req.body;

        if (!sellerId) return res.status(401).json({ message: "Unauthorized" });

        const amountToStart = parseInt(token_amount);
        const pricePerToken = parseFloat(price_per_token);

        if (!amountToStart || amountToStart <= 0) {
            return res.status(400).json({ message: "Listing amount must be greater than zero." });
        }
        if (!pricePerToken || pricePerToken <= 0) {
            return res.status(400).json({ message: "Price per token must be greater than zero." });
        }

        const kyc = await prisma.kYCRequest.findUnique({ where: { user_id: sellerId } });
        if (kyc?.status !== "approved") {
            return res.status(403).json({ message: "You must be KYC Verified to trade on the secondary market." });
        }

        const investment = await prisma.investment.findFirst({
            where: { investor_id: sellerId, sukuk_id: parseInt(sukuk_id) }
        });

        if (!investment || investment.tokens_owned <= 0) {
            return res.status(400).json({ message: "You do not own any tokens in this property." });
        }

        // Prevent Double-Listing
        const activeListings = await prisma.secondaryListing.findMany({
            where: { seller_id: sellerId, sukuk_id: parseInt(sukuk_id), status: "open" }
        });
        
        const lockedTokens = activeListings.reduce((sum, listing) => sum + listing.available_tokens, 0);
        const availableTokensToList = investment.tokens_owned - lockedTokens;

        if (availableTokensToList < amountToStart) {
            return res.status(400).json({ 
                message: `You only have ${availableTokensToList} unlocked tokens available to list.` 
            });
        }

        // Calculate Maturity/Expiration Date
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(days_valid));

        // Create Partial Listing
        const listing = await prisma.secondaryListing.create({
            data: {
                seller_id: sellerId,
                sukuk_id: parseInt(sukuk_id),
                total_tokens: amountToStart,
                available_tokens: amountToStart,
                price_per_token: pricePerToken,
                expires_at: expirationDate,
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
 * Fetches active, non-expired listings with available tokens.
 */
export const getMarketplaceListings = async (req: AuthRequest, res: Response) => {
    try {
        const listings = await prisma.secondaryListing.findMany({
            where: { 
                status: "open",
                available_tokens: { gt: 0 },
                expires_at: { gt: new Date() } // Hide expired listings
            },
            include: {
                sukuk: {
                    include: { property: { include: { documents: true } } }
                },
                seller: { select: { name: true } }
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
 * Executes partial buys, transfers PKR internally, and swaps tokens on-chain.
 */
export const executeTrade = async (req: AuthRequest, res: Response) => {
    try {
        const buyerId = req.user?.user_id;
        const listingId = parseInt(req.params.id);
        const tokensToBuy = parseInt(req.body.tokens_to_buy); // NEW: Buyer specifies amount

        if (!buyerId) return res.status(401).json({ message: "Unauthorized" });

        if (!tokensToBuy || tokensToBuy <= 0) {
            return res.status(400).json({ message: "You must buy at least 1 token." });
        }

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
        if (new Date() > listing.expires_at) {
            return res.status(400).json({ message: "This listing has expired." });
        }
        if (tokensToBuy > listing.available_tokens) {
            return res.status(400).json({ message: `Only ${listing.available_tokens} tokens remain.` });
        }

        const kyc = await prisma.kYCRequest.findUnique({ where: { user_id: buyerId } });
        if (kyc?.status !== "approved") {
            return res.status(403).json({ message: "You must be KYC Verified to trade." });
        }

        // Check Buyer's Fiat Balance
        const buyer = await prisma.user.findUnique({ where: { user_id: buyerId } });
        const totalCost = tokensToBuy * parseFloat(listing.price_per_token.toString());
        
        if (parseFloat(buyer!.fiat_balance.toString()) < totalCost) {
            return res.status(400).json({ message: `Insufficient funds. You need PKR ${totalCost}.` });
        }

        // Get Wallets for the Blockchain Transfer
        const sellerWallet = await prisma.wallet.findFirst({ where: { user_id: listing.seller_id, is_primary: true } });
        const buyerWallet = await prisma.wallet.findFirst({ where: { user_id: buyerId, is_primary: true } });

        if (!sellerWallet || !buyerWallet) {
            return res.status(400).json({ message: "Both parties must have connected wallets." });
        }

        const partitionName = `Sukuk_Asset_${listing.sukuk.property_id}`;

        // ======================================================
        // 1. THE BLOCKCHAIN SWAP
        // ======================================================
        let txHash;
        try {
            txHash = await blockchainService.transferTokens(
                partitionName,
                sellerWallet.wallet_address,
                buyerWallet.wallet_address,
                tokensToBuy.toString()
            );
        } catch (chainError: any) {
            console.error("Blockchain Transfer Failed:", chainError);
            return res.status(500).json({ message: "Blockchain transfer failed.", error: chainError.message });
        }

        // ======================================================
        // 2. DATABASE ESCROW UPDATES (Atomic Transaction)
        // ======================================================
        await prisma.$transaction(async (tx) => {
            // A. Move Fiat Money (Buyer -> Seller)
            await tx.user.update({
                where: { user_id: buyerId },
                data: { fiat_balance: { decrement: totalCost } }
            });
            await tx.user.update({
                where: { user_id: listing.seller_id },
                data: { fiat_balance: { increment: totalCost } }
            });

            // B. Update Listing Availability
            const newAvailable = listing.available_tokens - tokensToBuy;
            await tx.secondaryListing.update({
                where: { listing_id: listingId },
                data: { 
                    available_tokens: newAvailable,
                    status: newAvailable === 0 ? "completed" : "open" 
                }
            });

            // C. Deduct tokens from Seller
            const sellerInvestment = await tx.investment.findFirst({
                where: { investor_id: listing.seller_id, sukuk_id: listing.sukuk_id }
            });
            await tx.investment.update({
                where: { investment_id: sellerInvestment!.investment_id },
                data: { tokens_owned: { decrement: tokensToBuy } }
            });

            // D. Add tokens to Buyer
            const buyerInvestment = await tx.investment.findFirst({
                where: { investor_id: buyerId, sukuk_id: listing.sukuk_id }
            });
            if (buyerInvestment) {
                await tx.investment.update({
                    where: { investment_id: buyerInvestment.investment_id },
                    data: { tokens_owned: { increment: tokensToBuy } }
                });
            } else {
                await tx.investment.create({
                    data: {
                        investor_id: buyerId,
                        sukuk_id: listing.sukuk_id,
                        tokens_owned: tokensToBuy,
                        purchase_value: totalCost,
                        tx_hash: txHash
                    }
                });
            }
            
            // E. Log the transaction
            await tx.transactionLog.create({
                data: {
                    user_id: buyerId,
                    type: "buy", 
                    amount: totalCost,
                    status: "success",
                    tx_hash: txHash
                }
            });
        }, { timeout: 20000 }); 

        res.json({ 
            message: `Successfully purchased ${tokensToBuy} tokens for PKR ${totalCost}!`, 
            txHash 
        });
    } catch (error: any) {
        console.error("Execute Trade Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};