import { Request, Response } from "express";
/**
 * [MODULE] MFA Controller
 * -----------------------
 * Purpose: Two-Factor Authentication logic.
 * Tech: Uses 'Speakeasy' for TOTP generation/verification.
 */
import { PrismaClient } from "@prisma/client";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Generate MFA Secret and QR Code
export const generateMfaSecret = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const secret = speakeasy.generateSecret({
            name: `SmartSukuk (${req.user?.email})`,
        });

        // Save secret temporarily or permanently? 
        // Usually we save it but don't enable it until verified.
        // Let's upsert the MFASetting
        await prisma.mFASetting.upsert({
            where: { user_id: userId },
            update: {
                secret: secret.base32,
                is_enabled: false, // Not enabled yet
            },
            create: {
                user_id: userId,
                secret: secret.base32,
                is_enabled: false,
                backup_codes: [],
            },
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: "Scan this QR code with your authenticator app. Then verify to enable MFA.",
        });
    } catch (error) {
        console.error("MFA Generate Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Verify Token and Enable MFA
export const verifyMfa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { token } = req.body;

        if (!userId || !token) {
            res.status(400).json({ message: "Token required" });
            return;
        }

        const mfaSetting = await prisma.mFASetting.findUnique({
            where: { user_id: userId },
        });

        if (!mfaSetting || !mfaSetting.secret) {
            res.status(400).json({ message: "MFA not initialized" });
            return;
        }

        const verified = speakeasy.totp.verify({
            secret: mfaSetting.secret,
            encoding: "base32",
            token: token,
        });

        if (verified) {
            await prisma.mFASetting.update({
                where: { user_id: userId },
                data: { is_enabled: true },
            });
            res.json({ message: "MFA enabled successfully" });
        } else {
            res.status(400).json({ message: "Invalid token" });
        }
    } catch (error) {
        console.error("MFA Verify Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Disable MFA
export const disableMfa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // In a real app, we should ask for password or MFA token again before disabling
        await prisma.mFASetting.update({
            where: { user_id: userId },
            data: { is_enabled: false, secret: null },
        });

        res.json({ message: "MFA disabled successfully" });
    } catch (error) {
        console.error("MFA Disable Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
