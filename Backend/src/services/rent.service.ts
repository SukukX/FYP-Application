import prisma from '../config/prisma';
import { TransactionType, TransactionStatus, AuditModule, AuditAction, ActorRole } from '@prisma/client';

interface RentDistributionResult {
    rentId: number;
    grossAmount: number;
    netDistributed: number;
    platformFee: number;
    beneficiaries: number;
}

/**
 * [SERVICE] Execute Rent Distribution (The Engine)
 * Purpose: Takes an approved pending rent ID and safely distributes the funds.
 */
export const executeRentDistribution = async (
    rentId: number,
    adminId: number,
    ipAddress?: string
): Promise<RentDistributionResult> => {

    // 1. Fetch Pending Record
    const rentRecord = await prisma.rentPayment.findUnique({
        where: { rent_id: rentId },
        include: { property: { include: { sukuks: { where: { status: "active" } } } } }
    });

    if (!rentRecord) throw new Error("Rent record not found.");
    if (rentRecord.distributed_at !== null) throw new Error("Idempotency Alert: Rent already distributed.");

    const property = rentRecord.property;
    if (!property.sukuks || property.sukuks.length === 0) throw new Error("No active Sukuk found.");

    const sukuk = property.sukuks[0];
    const grossRent = Number(rentRecord.amount);

    // 2. The Snapshot
    const investments = await prisma.investment.findMany({
        where: { sukuk_id: sukuk.sukuk_id }
    });

    if (investments.length === 0) throw new Error("No investors found.");

    // 3. Strict Math
    const platformFee = grossRent * 0.02; // 2% Admin Fee
    const netRent = grossRent - platformFee;
    const yieldPerToken = netRent / sukuk.total_tokens;

    let totalDistributed = 0;

    // 4. Atomic Transaction
    await prisma.$transaction(async (tx) => {
        // Lock record
        await tx.rentPayment.update({
            where: { rent_id: rentRecord.rent_id },
            data: { distributed_at: new Date() }
        });

        // Distribute to wallets
        for (const inv of investments) {
            const exactPayout = Math.floor((inv.tokens_owned * yieldPerToken) * 100) / 100;

            if (exactPayout > 0) {
                // THE CRITICAL FIX: Actually give them the money!
                await tx.user.update({
                    where: { user_id: inv.investor_id },
                    data: { fiat_balance: { increment: exactPayout } }
                });

                await tx.profitDistribution.create({
                    data: {
                        sukuk_id: sukuk.sukuk_id,
                        investor_id: inv.investor_id,
                        amount: exactPayout,
                        tx_hash: `RENT-${rentRecord.rent_id}-INV-${inv.investor_id}`, 
                    }
                });

                await tx.transactionLog.create({
                    data: {
                        user_id: inv.investor_id,
                        sukuk_id: sukuk.sukuk_id,
                        type: TransactionType.profit_payout,
                        amount: exactPayout,
                        status: TransactionStatus.success,
                    }
                });

                await tx.notification.create({
                    data: {
                        user_id: inv.investor_id,
                        type: "profit",
                        message: `🎉 Rent distributed! You received PKR ${exactPayout.toLocaleString()} for ${property.title}.`
                    }
                });

                totalDistributed += exactPayout;
            }
        }

        // Audit Log
        await tx.auditLog.create({
            data: {
                user_id: adminId,
                actorRole: ActorRole.ADMIN,
                module: AuditModule.PROPERTY,
                action: AuditAction.UPDATED,
                targetId: property.property_id,
                targetName: property.title,
                details: { event: "RENT_DISTRIBUTED", gross_rent: grossRent, net_distributed: totalDistributed },
                ip_address: ipAddress || null,
            }
        });
    });

    return {
        rentId: rentRecord.rent_id,
        grossAmount: grossRent,
        netDistributed: totalDistributed,
        platformFee: platformFee,
        beneficiaries: investments.length
    };
};