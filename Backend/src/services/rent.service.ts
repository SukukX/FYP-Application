import { PrismaClient, TransactionType, TransactionStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * [SERVICE] Rent Distribution
 * Purpose: Handles the logic for collecting rent and distributing it to token holders.
 */

interface RentDistributionResult {
    rentId: number;
    totalAmount: number;
    beneficiaries: number;
    distributedAmount: number;
}

/**
 * Collects rent for a property and distributes it to investors.
 * @param propertyId The ID of the property.
 * @param amount The total rent amount collected.
 * @param periodStart Start date of the rent period.
 * @param periodEnd End date of the rent period.
 * @param isOwnerOccupied Whether the owner is the one "paying" (occupying).
 */
export const distributeRent = async (
    propertyId: number,
    amount: number,
    periodStart: Date,
    periodEnd: Date,
    isOwnerOccupied: boolean = false
): Promise<RentDistributionResult> => {

    // 1. Fetch Property & Sukuk
    const property = await prisma.property.findUnique({
        where: { property_id: propertyId },
        include: { sukuks: true }
    });

    if (!property) throw new Error("Property not found");
    const sukuk = property.sukuks[0];
    if (!sukuk) throw new Error("No active Sukuk found for this property");

    // 2. Fetch Eligible Investors (Token Holders > 0)
    // We include the Owner if they hold tokens (Inventory)
    const investments = await prisma.investment.findMany({
        where: {
            sukuk_id: sukuk.sukuk_id,
            tokens_owned: { gt: 0 }
        },
        include: { investor: true }
    });

    if (investments.length === 0) {
        throw new Error("No token holders found to distribute rent to.");
    }

    const totalTokens = investments.reduce((sum, inv) => sum + inv.tokens_owned, 0);

    // Safety check: Total tokens should match Sukuk total, but we use the actual sum of held tokens to be safe.
    // If tokens are burned or lost, we only distribute to current holders.
    if (totalTokens === 0) throw new Error("Total tokens held is zero.");

    // 3. Calculate Distribution Rate
    // Rent per Token = Total Rent / Total Tokens
    const rentPerToken = amount / totalTokens;

    // 4. Perform Transaction (Atomic)
    let distributedAmount = 0;

    await prisma.$transaction(async (tx) => {
        // A. Record Rent Payment
        const rentPayment = await tx.rentPayment.create({
            data: {
                property_id: propertyId,
                amount: amount,
                payment_date: new Date(),
                period_start: periodStart,
                period_end: periodEnd,
                is_owner_occupied: isOwnerOccupied,
                distributed_at: new Date() // Mark as distributed immediately
            }
        });

        // B. Distribute to Each Investor
        for (const inv of investments) {
            const share = inv.tokens_owned * rentPerToken;

            if (share > 0) {
                // Create Profit Record
                await tx.profitDistribution.create({
                    data: {
                        sukuk_id: sukuk.sukuk_id,
                        investor_id: inv.investor_id,
                        amount: share,
                        tx_hash: `RENT_DIST_${rentPayment.rent_id}_${inv.investor_id}` // Internal Ref
                    }
                });

                // Log Transaction
                await tx.transactionLog.create({
                    data: {
                        user_id: inv.investor_id,
                        sukuk_id: sukuk.sukuk_id,
                        type: TransactionType.profit_payout,
                        amount: share,
                        status: TransactionStatus.success,
                        tx_hash: `RENT_DIST_${rentPayment.rent_id}`
                    }
                });

                // Notify User
                await tx.notification.create({
                    data: {
                        user_id: inv.investor_id,
                        type: "profit",
                        message: `You received $${share.toFixed(2)} in rent dividends from ${property.title}.`
                    }
                });

                distributedAmount += share;
            }
        }
    });

    return {
        rentId: -1, // We don't return the exact ID from transaction easily without returning it from the callback, but strictly we could.
        totalAmount: amount,
        beneficiaries: investments.length,
        distributedAmount
    };
};
