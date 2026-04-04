import { Response } from "express";
import { PrismaClient, KYCStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// [HELPER] Smart Alerts System (Unchanged)
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
        const kycStatus = (await prisma.kYCRequest.findUnique({ where: { user_id: userId } }))?.status || "not_submitted";
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

        // ==========================================
        // 3. Fetch & Calculate INVESTOR Data
        // ==========================================
        const investments = await prisma.investment.findMany({
            where: { investor_id: userId, tokens_owned: { gt: 0 } },
            include: {
                sukuk: {
                    include: { property: true } // Fetches the full property for the active investments list
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

        // ==========================================
        // 4. Send the Unified Response
        // ==========================================
        res.json({
            role: "user", // The new unified role
            summary: {
                isOwner: properties.length > 0,
                isInvestor: investments.length > 0,
            },
            common: {
                alerts,
                kycStatus,
                walletAddress: wallet?.wallet_address || null,
                mfaEnabled
            },
            ownerData: {
                stats: { activeListings, tokensSold, totalRevenue, pendingApprovals },
                listings: formattedProperties
            },
            investorData: {
                stats: { totalInvestment, totalTokens, propertiesOwned: propertySet.size, totalProfitEarned: 0 },
                portfolio,
                investments // FIXED: Now passing the investments array to the frontend UI!
            }
        });

    } catch (error) {
        console.error("Unified Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ROLE] Regulator Dashboard (Unchanged)
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
            // FIXED: Swapped { not: "guest" } for "user" to match our new unified role enum
            approvedUsers: await prisma.user.count({ where: { role: "user", kyc_request: { status: "approved" } } }),
            activeSukuks: await prisma.sukuk.count({ where: { status: "active" } }),
            approvedListings: await prisma.property.count({ where: { verification_status: "approved" } }),
        };

        const kycQueue = await prisma.kYCRequest.findMany({
            where: { status: KYCStatus.pending },
            take: 5,
            orderBy: { submitted_at: 'asc' },
            include: { user: { select: { name: true, email: true, role: true } } }
        });

        const listingQueue = await prisma.property.findMany({
            where: { verification_status: "pending" },
            take: 5,
            orderBy: { created_at: 'asc' },
            include: {
                owner: { select: { name: true, email: true } },
                sukuks: { select: { total_tokens: true } },
                documents: true
            }
        });

        res.json({ role: "regulator", stats, kycQueue, listingQueue });
    } catch (error) {
        console.error("Regulator Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};