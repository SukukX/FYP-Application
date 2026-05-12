import prisma from '../config/prisma';

/**
 * Chatbot Service
 * ---------------
 * Responsible for gathering user-specific context to personalize chatbot interactions.
 * Uses a 60-second in-memory cache per user to avoid re-querying on every chat message.
 */

// In-memory TTL cache: userId → { context, timestamp }
const _contextCache = new Map<number, { context: string; ts: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export const getChatbotUserContext = async (userId: number): Promise<string> => {
    // Check cache first
    const cached = _contextCache.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.context;
    }

    const context = await _fetchUserContext(userId);
    _contextCache.set(userId, { context, ts: Date.now() });
    return context;
};

const _fetchUserContext = async (userId: number): Promise<string> => {
    try {
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            include: {
                kyc_request: true,
                properties: {
                    include: {
                        sukuks: {
                            include: { investments: true }
                        }
                    }
                },
                investments: {
                    where: { tokens_owned: { gt: 0 } },
                    include: {
                        sukuk: {
                            include: {
                                property: { select: { title: true, owner_id: true } }
                            }
                        }
                    }
                },
                profit_distributions: true
            }
        });

        if (!user) return "User data not found.";

        const kycStatus = user.kyc_request?.status || "Not started";
        const walletBalance = user.fiat_balance || 0;
        const totalRentEarned = user.profit_distributions.reduce((sum, d) => sum + Number(d.amount), 0);
        
        // --- Owner Context (Properties listed by user) ---
        const propertiesCount = user.properties.length;
        let ownerSummary = "";
        if (propertiesCount > 0) {
            ownerSummary = `OWNER DASHBOARD:\n- Total Properties: ${propertiesCount}\n`;
            user.properties.forEach(p => {
                const sukuk = p.sukuks[0];
                const tokensSold = sukuk ? sukuk.investments.reduce((sum, inv) => inv.investor_id !== userId ? sum + inv.tokens_owned : sum, 0) : 0;
                const revenue = tokensSold * (sukuk ? Number(sukuk.token_price) : 0);
                ownerSummary += `- "${p.title}": Status=${p.listing_status}, Verification=${p.verification_status}, Tokens Sold=${tokensSold}, Revenue=PKR ${revenue.toLocaleString()}\n`;
            });
        }
        
        // --- Investor Context (Holdings in other properties) ---
        const holdings = user.investments.filter(inv => inv.sukuk.property.owner_id !== userId);
        const holdingsCount = holdings.length;
        let investorSummary = "";
        if (holdingsCount > 0) {
            investorSummary = `INVESTOR PORTFOLIO:\n- Active Investments: ${holdingsCount}\n- Total Rent Received: PKR ${totalRentEarned.toLocaleString()}\n`;
            holdings.forEach(inv => {
                const currentPrice = Number(inv.sukuk.token_price);
                const purchaseValue = Number(inv.purchase_value || 0);
                const currentValue = inv.tokens_owned * currentPrice;
                const profitLoss = currentValue - purchaseValue;
                const profitLossPct = purchaseValue > 0 ? ((profitLoss / purchaseValue) * 100).toFixed(2) : "0";
                
                investorSummary += `- "${inv.sukuk.property.title}": Tokens=${inv.tokens_owned}, Current Value=PKR ${currentValue.toLocaleString()}, P/L=PKR ${profitLoss.toLocaleString()} (${profitLossPct}%)\n`;
            });
        }
        
        let context = `USER PROFILE:\n`;
        context += `- Name: ${user.name}\n`;
        context += `- Role: ${user.role}\n`;
        context += `- KYC Status: ${kycStatus}\n`;
        context += `- Wallet Balance: PKR ${walletBalance.toLocaleString()}\n`;
        
        context += `\n${ownerSummary}`;
        context += `\n${investorSummary}`;

        return context;
    } catch (error) {
        console.error("Error gathering chatbot user context:", error);
        return "Error loading user profile data.";
    }
};
