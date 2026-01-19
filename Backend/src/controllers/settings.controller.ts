import { Response } from "express";
/**
 * [MODULE] Settings Controller
 * ----------------------------
 * Purpose: Aggregates User Profile, Security (MFA), and Verification (KYC) status.
 */
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export const getSettings = async (req: AuthRequest, res: Response) => {
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
                phone_number: true,
                country: true,
                profile_pic: true,
                mfa_setting: {
                    select: {
                        is_enabled: true,
                    },
                },
                kyc_request: {
                    select: {
                        status: true,
                        rejection_reason: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json({
            profile: {
                name: user.name,
                email: user.email,
                phone: user.phone_number,
                country: user.country,
                avatar: user.profile_pic,
            },
            security: {
                mfaEnabled: user.mfa_setting?.is_enabled || false,
            },
            verification: {
                status: user.kyc_request?.status || "not_submitted",
                message: user.kyc_request?.rejection_reason || null,
            },
        });
    } catch (error) {
        console.error("Get Settings Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
