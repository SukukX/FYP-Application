import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/prisma";
import { executeRentDistribution } from "../services/rent.service";

/**
 * [MAKER] Submit Rent (Property Owner)
 * Purpose: Creates a pending rent record. No money is moved yet.
 */
export const submitRent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { propertyId, amount, periodStart, periodEnd } = req.body;
        const parsedAmount = parseFloat(amount);

        if (!propertyId || isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "Invalid rent parameters." });
        }

        // Verify the user actually owns this property
        const property = await prisma.property.findUnique({
            where: { property_id: Number(propertyId) }
        });

        if (!property || property.owner_id !== userId) {
            return res.status(403).json({ message: "Forbidden: You do not own this property." });
        }

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        // 1. Basic Date Validation
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format provided." });
        }

        // 2. Chronological Check
        if (startDate >= endDate) {
            return res.status(400).json({ message: "Period end date must be after the start date." });
        }

        // Create the pending record (distributed_at is automatically null)
        const rentRecord = await prisma.rentPayment.create({
            data: {
                property_id: property.property_id,
                amount: parsedAmount,
                payment_date: new Date(),
                period_start: new Date(periodStart),
                period_end: new Date(periodEnd),
                is_owner_occupied: property.occupancy_status === 'owner_occupied',
            }
        });

        res.status(201).json({ 
            message: "Rent submitted successfully and is pending admin approval.", 
            rentRecord 
        });

    } catch (error: any) {
        console.error("Submit Rent Error:", error);
        res.status(500).json({ message: "Server error during rent submission." });
    }
};

/**
 * [CHECKER] Approve & Distribute Rent (Admin Only)
 * Purpose: Verifies admin access, then triggers the Service engine to distribute funds.
 */
export const distributeRent = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.user_id;
        const adminRole = req.user?.role;

        // 1. Security Check
        if (!adminId || adminRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admins can distribute rent." });
        }

        const { rentId } = req.body;

        if (!rentId) {
            return res.status(400).json({ message: "Rent ID is required." });
        }

        // 2. Trigger the isolated Service Engine
        const result = await executeRentDistribution(Number(rentId), adminId, req.ip);

        // 3. Return Success
        res.status(200).json({ 
            message: "Rent distributed successfully", 
            data: result
        });

    } catch (error: any) {
        console.error("Distribute Rent Error:", error);
        
        // Catch our specific service-level errors (like double-taps) and return 400
        if (error.message.includes("Idempotency") || error.message.includes("not found")) {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: "Server error during rent distribution." });
    }
};