import { Response } from "express";
/**
 * [MODULE] Dashboard Controller
 * ---------------------------
 * Purpose: Centralized data fetcher for all user roles.
 * Features:
 * - Smart Alerts: Checks KYC/MFA status and pushes UI warnings.
 * - Role Logic: Separate handlers for Investor, Owner, Regulator.
 */
import { PrismaClient, KYCStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// [HELPER] Smart Alerts System
// Logic: Checks DB state (KYC = pending/rejected, MFA = disabled) -> Returns Actionable UI Alerts.
const getCommonAlerts = async (userId: number) => {
    const alerts = [];

    // Check KYC Status
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
            message: `KYC Rejected: ${kyc.rejection_reason}. Please resubmit.`,
            action: "/kyc",
        });
    } else if (kyc.status === KYCStatus.pending) {
        alerts.push({
            type: "info",
            message: "Your KYC is under review.",
            action: "/kyc",
        });
    }

    // Check MFA Status
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

export const getInvestorDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const alerts = await getCommonAlerts(userId);

        // Fetch Investments with Sukuk and Property details
        const investments = await prisma.investment.findMany({
            where: { investor_id: userId },
            include: {
                sukuk: {
                    include: {
                        property: {
                            select: {
                                property_type: true
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
            // Only count if they still own tokens (though tokens_owned should be > 0 ideally)
            if (inv.tokens_owned > 0) {
                totalTokens += inv.tokens_owned;

                // Value = Tokens * Current Price
                const currentValue = inv.tokens_owned * parseFloat(inv.sukuk.token_price.toString());
                totalInvestment += currentValue;

                propertySet.add(inv.sukuk.property_id);

                // Portfolio Distribution by Property Type
                const type = inv.sukuk.property.property_type;
                if (!portfolioMap[type]) portfolioMap[type] = 0;
                portfolioMap[type] += currentValue;
            }
        });

        const stats = {
            totalInvestment,
            totalTokens,
            propertiesOwned: propertySet.size,
            totalProfitEarned: 0, // Placeholder for now
        };

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

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: userId, is_primary: true }
        });

        res.json({
            role: "investor",
            stats,
            portfolio, // Send this for the Pie Chart
            alerts,
            kycStatus: (await prisma.kYCRequest.findUnique({ where: { user_id: userId } }))?.status || "not_submitted",
            walletAddress: wallet?.wallet_address || null,
            recentActivity: [],
        });
    } catch (error) {
        console.error("Investor Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ROLE] Owner Dashboard
 * Data:
 * - Active Listings (Properties w/ 'active' status).
 * - Sales Stats (Calculated from Sukuk Investments).
 * - Action Items (KYC pending, etc.).
 */
export const getOwnerDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const alerts = await getCommonAlerts(userId);

        // Fetch Owner's Properties
        const properties = await prisma.property.findMany({
            where: { owner_id: userId },
            orderBy: { created_at: 'desc' },
            include: {
                sukuks: {
                    include: { investments: true } // Include investments to calculate sold tokens
                },
                verification_logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                },
                documents: true
            }
        });

        // Calculate Stats
        const activeListings = properties.filter(p => p.listing_status === 'active').length;
        const pendingApprovals = properties.filter(p => p.verification_status === 'pending').length;

        let tokensSold = 0;
        let totalRevenue = 0;

        properties.forEach(p => {
            if (p.sukuks && p.sukuks.length > 0) {
                const sukuk = p.sukuks[0];

                // Calculate sold tokens (Exclude Owner's "Inventory" holding)
                const soldForSukuk = sukuk.investments.reduce((sum, inv) => {
                    if (inv.investor_id === userId) return sum;
                    return sum + inv.tokens_owned;
                }, 0);

                tokensSold += soldForSukuk;
                totalRevenue += soldForSukuk * parseFloat(sukuk.token_price.toString());
            }
        });

        const stats = {
            activeListings,
            tokensSold,
            totalRevenue,
            pendingApprovals,
        };

        const formattedProperties = properties.map(p => {
            const sukuk = p.sukuks[0];
            const soldForSukuk = sukuk ? sukuk.investments.reduce((sum, inv) => {
                if (inv.investor_id === userId) return sum;
                return sum + inv.tokens_owned;
            }, 0) : 0;

            return {
                ...p,
                total_tokens: sukuk ? sukuk.total_tokens : 0,
                tokens_available: sukuk ? sukuk.available_tokens : 0,
                tokens_sold: soldForSukuk,
                token_price: sukuk ? sukuk.token_price : 0,
            };
        });

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: userId, is_primary: true }
        });

        res.json({
            role: "owner",
            stats,
            alerts,
            listings: formattedProperties,
            kycStatus: (await prisma.kYCRequest.findUnique({ where: { user_id: userId } }))?.status || "not_submitted",
            checkWallet: wallet?.wallet_address || null, // Keeping naming distinct just in case, or use walletAddress for consistency
            walletAddress: wallet?.wallet_address || null,
            mfaEnabled: (await prisma.mFASetting.findUnique({ where: { user_id: userId } }))?.is_enabled || false,
        });
    } catch (error) {
        console.error("Owner Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ROLE] Regulator Dashboard
 * Data:
 * - Queues: Pending KYC & Property Verification requests.
 * - Platform Stats: Total Users, Active Sukuks.
 */
export const getRegulatorDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Real Data for Queues
        const pendingKYC = await prisma.kYCRequest.count({
            where: { status: KYCStatus.pending },
        });

        const pendingListings = await prisma.property.count({
            where: { verification_status: "pending" },
        });

        const stats = {
            pendingKYC,
            pendingListings,
            totalUsers: await prisma.user.count(),
            approvedUsers: await prisma.user.count({ where: { role: { not: "guest" }, kyc_request: { status: "approved" } } }),
            activeSukuks: await prisma.sukuk.count({ where: { status: "active" } }),
            approvedListings: await prisma.property.count({ where: { verification_status: "approved" } }),
        };

        // Fetch Queues
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
                documents: true // Include documents for review
            }
        });

        res.json({
            role: "regulator",
            stats,
            kycQueue,
            listingQueue,
        });
    } catch (error) {
        console.error("Regulator Dashboard Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
