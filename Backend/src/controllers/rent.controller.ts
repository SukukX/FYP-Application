import { Request, Response } from "express";
import { distributeRent } from "../services/rent.service";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * [CONTROLLER] Rent Management
 */

export const collectRentCallback = async (req: AuthRequest, res: Response) => {
    try {
        const { propertyId, amount, periodStart, periodEnd, isOwnerOccupied } = req.body;
        const userId = req.user?.user_id;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!propertyId || !amount || !periodStart || !periodEnd) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Parse dates
        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        const result = await distributeRent(
            Number(propertyId),
            Number(amount),
            start,
            end,
            isOwnerOccupied === true
        );

        res.json({
            message: "Rent collected and distributed successfully",
            data: result
        });

    } catch (error: any) {
        console.error("Rent Collection Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
