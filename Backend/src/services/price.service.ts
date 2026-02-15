import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * [SERVICE] Price Management
 * Purpose: Handles the lifecycle of property token price changes.
 */

/**
 * 1. Owner requests a price change.
 */
export const requestPriceUpdate = async (
    userId: number,
    propertyId: number,
    newValuation: number,
    newTokenPrice: number,
    justification: string
) => {
    // Validate Property Ownership
    const property = await prisma.property.findUnique({
        where: { property_id: propertyId },
        include: { sukuks: true }
    });

    if (!property) throw new Error("Property not found");
    if (property.owner_id !== userId) throw new Error("Unauthorized: Only owner can request updates");

    const sukuk = property.sukuks[0];
    if (!sukuk) throw new Error("Sukuk not found");

    // Create Request
    return await prisma.listingUpdateRequest.create({
        data: {
            property_id: propertyId,
            owner_id: userId,
            field_changed: "valuation_and_price", // Grouping them for simplicity
            old_value: JSON.stringify({ valuation: Number(property.valuation), token_price: Number(sukuk.token_price) }),
            new_value: JSON.stringify({ valuation: newValuation, token_price: newTokenPrice }),
            justification,
            status: VerificationStatus.pending
        }
    });
};

/**
 * 2. Regulator reviews the request.
 */
export const reviewPriceUpdate = async (
    regulatorId: number,
    requestId: number,
    approve: boolean,
    comments?: string
) => {
    const request = await prisma.listingUpdateRequest.findUnique({
        where: { request_id: requestId },
        include: { property: { include: { sukuks: true } } }
    });

    if (!request) throw new Error("Request not found");
    if (request.status !== VerificationStatus.pending) throw new Error("Request is not pending");

    if (approve) {
        const newValue = JSON.parse(request.new_value);
        const oldValue = JSON.parse(request.old_value);
        const sukuk = request.property.sukuks[0];

        await prisma.$transaction(async (tx) => {
            // A. Update Request Status
            await tx.listingUpdateRequest.update({
                where: { request_id: requestId },
                data: {
                    status: VerificationStatus.approved,
                    reviewed_by: regulatorId,
                    reviewed_at: new Date()
                }
            });

            // B. Update Property Valuation
            await tx.property.update({
                where: { property_id: request.property_id },
                data: { valuation: newValue.valuation }
            });

            // C. Update Token Price
            await tx.sukuk.update({
                where: { sukuk_id: sukuk.sukuk_id },
                data: { token_price: newValue.token_price }
            });

            // D. Log Price History
            await tx.tokenPriceHistory.create({
                data: {
                    sukuk_id: sukuk.sukuk_id,
                    old_price: oldValue.token_price,
                    new_price: newValue.token_price,
                    changed_by: request.owner_id,
                    change_reason: request.justification,
                    effective_date: new Date()
                }
            });

            // E. Notify Owner
            await tx.notification.create({
                data: {
                    user_id: request.owner_id,
                    type: "system",
                    message: `Your price update request for ${request.property.title} was APPROVED.`
                }
            });
        });

        return { message: "Price update approved and applied." };

    } else {
        // Reject
        await prisma.listingUpdateRequest.update({
            where: { request_id: requestId },
            data: {
                status: VerificationStatus.rejected,
                reviewed_by: regulatorId,
                reviewed_at: new Date(),
                rejection_reason: comments
            }
        });

        // Notify Owner
        await prisma.notification.create({
            data: {
                user_id: request.owner_id,
                type: "system",
                message: `Your price update request for ${request.property.title} was REJECTED. Reason: ${comments}`
            }
        });

        return { message: "Price update rejected." };
    }
};

/**
 * 3. Fetch Price History (for Graph)
 */
export const getPriceHistory = async (propertyId: number) => {
    const property = await prisma.property.findUnique({
        where: { property_id: propertyId },
        include: { sukuks: true }
    });

    if (!property || !property.sukuks[0]) throw new Error("Property or Sukuk not found");

    const history = await prisma.tokenPriceHistory.findMany({
        where: { sukuk_id: property.sukuks[0].sukuk_id },
        orderBy: { effective_date: 'asc' },
        include: { user: { select: { name: true } } }
    });

    return history.map(h => ({
        price: Number(h.new_price),
        date: h.effective_date,
        reason: h.change_reason
    }));
};
