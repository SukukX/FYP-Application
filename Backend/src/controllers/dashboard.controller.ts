import { Response } from "express";
import { PrismaClient, KYCStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { ethers } from "ethers";
import { provider } from "../config/blockchain";

const prisma = new PrismaClient();

// [HELPER] Smart Alerts System
const getCommonAlerts = async (userId: number) => {
    const alerts = [];

    const kyc = await prisma.kYCRequest.findUnique({
        where: { user_id: userId },
    });

    if (!kyc) {
        alerts.push({
            type: "warning",
            message: "Complete your KYC verification to start investing.",
            action: "/kyc",
        });
    } else if (kyc.status === KYCStatus.rejected) {
        alerts.push({
            type: "error",
            title: "KYC Application Rejected",
            message: kyc.rejection_reason || "Check your documents.",
            footer: "Please resubmit your application.",
            action: "/kyc",
        });
    } else if (kyc.status === KYCStatus.pending) {
        alerts.push({
            type: "info",
            message: "Your KYC is under review.",
            action: "/kyc",
        });
    }

    const mfa = await prisma.mFASetting.findUnique({
        where: { user_id: userId },
    });

    if (!mfa || !mfa.is_enabled) {
        alerts.push({
            type: "info",
            message: "Enable 2FA for better security.",
            action: "/settings/security",
        });
    }

    return alerts;
};

/**
 * [MODULE] Unified User Dashboard
 * -------------------------------
 * Consolidates Owner and Investor views into a single unified JSON response.
 */
export const getUserDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // 1. Fetch Common Global Data
        const alerts = await getCommonAlerts(userId);
        const wallet = await prisma.wallet.findFirst({
            where: { user_id: userId, is_primary: true }
        });
        const kycRecord = await prisma.kYCRequest.findUnique({ where: { user_id: userId } });
        const mfaEnabled = (await prisma.mFASetting.findUnique({ where: { user_id: userId } }))?.is_enabled || false;

        // ==========================================
        // 2. Fetch & Calculate OWNER Data
        // ==========================================
        const properties = await prisma.property.findMany({
            where: { owner_id: userId },
            orderBy: { created_at: 'desc' },
            include: {
                sukuks: {
                    include: { investments: true } 
                },
                verification_logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                documents: true
            }
        });

        const activeListings = properties.filter(p => p.listing_status === 'active').length;
        const pendingApprovals = properties.filter(p => p.verification_status === 'pending').length;
        let tokensSold = 0;
        let totalRevenue = 0;

        const formattedProperties = properties.map(p => {
            const sukuk = p.sukuks[0];
            const soldForSukuk = sukuk ? sukuk.investments.reduce((sum, inv) => {
                if (inv.investor_id === userId) return sum; // Exclude owner's inventory
                return sum + inv.tokens_owned;
            }, 0) : 0;

            if (sukuk) {
                tokensSold += soldForSukuk;
                totalRevenue += soldForSukuk * parseFloat(sukuk.token_price.toString());
            }

            return {
                ...p,
                total_tokens: sukuk ? sukuk.total_tokens : 0,
                tokens_available: sukuk ? sukuk.available_tokens : 0,
                tokens_sold: soldForSukuk,
                token_price: sukuk ? sukuk.token_price : 0,
            };
        });
        
        const rejectedProperties = properties.filter(p => p.verification_status === 'rejected').map(p => ({
            property_id: p.property_id,
            title: p.title,
            location: p.location,
            verification_status: p.verification_status,
            rejection_reason: p.verification_logs?.[0]?.comments || null,
            updated_at: p.updated_at,
        }));

        // ==========================================
        // 3. Fetch & Calculate INVESTOR Data
        // ==========================================
        const investments = await prisma.investment.findMany({
            where: {
                investor_id: userId,
                tokens_owned: { gt: 0 },
                // Exclude properties that this user OWNS — those are owner inventory, not investments
                sukuk: {
                    property: {
                        owner_id: { not: userId }
                    }
                }
            },
            include: {
                sukuk: {
                    include: {
                        property: {
                            include: {
                                documents: {
                                    where: { file_type: { startsWith: 'image/' } },
                                    select: { file_path: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        let totalInvestment = 0;
        let totalTokens = 0;
        const propertySet = new Set();
        const portfolioMap: Record<string, number> = {};

        investments.forEach(inv => {
            totalTokens += inv.tokens_owned;
            const currentValue = inv.tokens_owned * parseFloat(inv.sukuk.token_price.toString());
            totalInvestment += currentValue;
            propertySet.add(inv.sukuk.property_id);

            const type = inv.sukuk.property.property_type;
            if (!portfolioMap[type]) portfolioMap[type] = 0;
            portfolioMap[type] += currentValue;
        });

        // Format for Recharts
        const colors: Record<string, string> = {
            residential: "hsl(var(--primary))",
            commercial: "hsl(var(--accent))",
            industrial: "hsl(var(--verified))",
        };

        const portfolio = Object.keys(portfolioMap).map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: portfolioMap[type],
            color: colors[type] || "#8884d8"
        }));

        const holdings = investments.map(inv => {
            const sukuk = inv.sukuk as any;
            const property = sukuk.property as any;
            const currentPrice = parseFloat(sukuk.token_price.toString());
            const purchaseValue = parseFloat((inv.purchase_value ?? 0).toString());
            const currentValue = inv.tokens_owned * currentPrice;
            const profitLoss = currentValue - purchaseValue;
            const profitLossPct = purchaseValue > 0 ? ((profitLoss / purchaseValue) * 100) : 0;
            return {
                investment_id: inv.investment_id,
                property_id: sukuk.property_id,
                property_title: property.title,
                property_location: property.location,
                property_type: property.property_type,
                property_image: property.documents?.[0]?.file_path || null,
                sukuk_id: sukuk.sukuk_id,
                tokens_owned: inv.tokens_owned,
                price_per_token: currentPrice,
                purchase_value: purchaseValue,
                current_value: currentValue,
                profit_loss: profitLoss,
                profit_loss_pct: profitLossPct,
                purchase_date: inv.purchase_date,
            };
        });

        // ==========================================
        // 4. Send the Unified Response
        // ==========================================
        let liveWalletBalance = 0;
        if (wallet?.wallet_address) {
            try {
                const balance = await provider.getBalance(wallet.wallet_address);
                liveWalletBalance = parseFloat(ethers.formatEther(balance));
            } catch (err) {
                console.error("Failed to fetch wallet balance via ethers:", err);
            }
        }

        res.json({
            role: "user", // The new unified role
            summary: {
                isOwner: properties.length > 0,
                isInvestor: investments.length > 0,
            },
            common: {
                alerts,
                kycStatus: kycRecord?.status || "not_submitted",
                kycRejectionReason: kycRecord?.rejection_reason || null,
                existingKyc: kycRecord ? {
                    cnic_number: kycRecord.cnic_number,
                    cnic_expiry: kycRecord.cnic_expiry,
                    cnic_front: kycRecord.cnic_front,
                    cnic_back: kycRecord.cnic_back,
                    face_scan: kycRecord.face_scan,
                } : null,
                walletAddress: wallet?.wallet_address || null,
                walletBalance: wallet ? Number(wallet.balance) : 0,
                mfaEnabled
            },
            ownerData: {
                stats: { activeListings, tokensSold, totalRevenue, pendingApprovals },
                listings: formattedProperties,
                rejectedProperties
            },
            investorData: {
                stats: { totalInvestment, totalTokens, propertiesOwned: propertySet.size, totalProfitEarned: 0 },
                portfolio,
                investments,
                holdings
            }
        });

    } catch (error) {
        console.error("Unified Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ROLE] Regulator Dashboard
 */
export const getRegulatorDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const pendingKYC = await prisma.kYCRequest.count({ where: { status: KYCStatus.pending } });
        const pendingListings = await prisma.property.count({ where: { verification_status: "pending" } });

        const stats = {
            pendingKYC,
            pendingListings,
            totalUsers: await prisma.user.count(),
            approvedUsers: await prisma.user.count({ where: { role: "user", kyc_request: { status: "approved" } } }),
            activeSukuks: await prisma.sukuk.count({ where: { status: "active" } }),
            approvedListings: await prisma.property.count({ where: { verification_status: "approved" } }),
        };

        // Fetch Queues with is_resubmission flag
        const rawKycQueue = await prisma.kYCRequest.findMany({
            where: { status: KYCStatus.pending },
            take: 50,
            orderBy: { submitted_at: 'asc' },
            include: { user: { select: { name: true, email: true, role: true } } }
        });
        const kycQueue = rawKycQueue.map(k => ({
            ...k,
            is_resubmission: !!(k.reviewed_at && k.reviewed_by),
        }));

        const rawListingQueue = await prisma.property.findMany({
            where: { verification_status: "pending" },
            take: 50,
            orderBy: { created_at: 'asc' },
            include: {
                owner: { select: { name: true, email: true } },
                sukuks: { select: { total_tokens: true } },
                documents: true,
                verification_logs: { orderBy: { timestamp: 'desc' }, take: 1 },
            }
        });
        const listingQueue = rawListingQueue.map(l => ({
            ...l,
            is_resubmission: l.verification_logs.length > 0,
            rejection_reason: l.verification_logs[0]?.comments || null,
        }));

        res.json({ role: "regulator", stats, kycQueue, listingQueue });
    } catch (error) {
        console.error("Regulator Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Get Audit Logs
 * Purpose: Returns a list of all KYC and Property actions for regulator/admin review.
 * Filters: ?module=KYC|PROPERTY  ?action=APPROVED|REJECTED
 */
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { module, action } = req.query;

        const logs = await prisma.auditLog.findMany({
            where: {
                ...(module ? { module: module as any } : {}),
                ...(action ? { action: action as any } : {}),
                module: module ? (module as any) : { not: null },
            },
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { timestamp: "desc" },
            take: 200, 
        });

        res.json({ logs });
    } catch (error) {
        console.error("Get Audit Logs Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
