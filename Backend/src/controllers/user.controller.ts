import { Request, Response } from "express";
/**
 * [MODULE] User Controller
 * ------------------------
 * Purpose: Management of User Profile data.
 * Features:
 * - Fetch Profile (includes KYC status for UI logic).
 * - Update Profile (Name, Address, etc.).
 */
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

/**
 * [ACTION] Get Profile
 * Purpose: Hydrates the frontend with user details.
 * DB Query: Fetches User + Nested KYC Request Status (to show badges/warnings in UI).
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                phone_number: true,
                country: true,
                address: true,
                dob: true,
                profile_pic: true,
                kyc_request: {
                    select: {
                        status: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { name, phone_number, country, address, dob } = req.body;

        const updatedUser = await prisma.user.update({
            where: { user_id: userId },
            data: {
                name,
                phone_number,
                country,
                address,
                dob: dob ? new Date(dob) : undefined,
            },
            select: {
                user_id: true,
                name: true,
                email: true,
                phone_number: true,
                country: true,
                address: true,
                dob: true,
            },
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
