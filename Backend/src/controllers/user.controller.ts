import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import * as bcrypt from "bcrypt";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

const prisma = new PrismaClient();

/**
 * [ACTION] Get Profile
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
                mfa_setting: {
                    select: {
                        is_enabled: true,
                    },
                },
                wallets: {
                    select: {
                        wallet_address: true,
                        is_primary: true,
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

/**
 * [ACTION] Update Profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { name, phone_number, country, address, dob, profile_pic } = req.body;

        const updatedUser = await prisma.user.update({
            where: { user_id: userId },
            data: {
                name,
                phone_number,
                country,
                address,
                dob: dob ? new Date(dob) : undefined,
                profile_pic,
            },
            select: {
                user_id: true,
                name: true,
                email: true,
                phone_number: true,
                country: true,
                address: true,
                dob: true,
                profile_pic: true,
            },
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Upload Avatar
 */
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Cast req to any to access file
        const file = (req as any).file;

        if (!file) {
            res.status(400).json({ message: "No image file provided" });
            return;
        }

        // Cloudinary returns the URL in file.path
        const profilePicUrl = file.path;

        const updatedUser = await prisma.user.update({
            where: { user_id: userId },
            data: {
                profile_pic: profilePicUrl,
            },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                profile_pic: true,
            },
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Upload Avatar Error:", error);
        res.status(500).json({ message: "Server error during upload" });
    }
};

/**
 * [ACTION] Change Password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { user_id: userId } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Incorrect current password" });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { user_id: userId },
            data: { password: hashedPassword },
        });

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Connect Wallet
 */
export const connectWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { walletAddress, chainId } = req.body;

        if (!userId || !walletAddress) {
            res.status(400).json({ message: "Wallet address is required" });
            return;
        }

        // Check if wallet is already connected to ANY user
        const existingWallet = await prisma.wallet.findUnique({
            where: { wallet_address: walletAddress },
        });

        if (existingWallet) {
            if (existingWallet.user_id !== userId) {
                res.status(400).json({ message: "Wallet already connected to another account" });
                return;
            }
            // Already connected to this user, just return success
            res.json(existingWallet);
            return;
        }

        const newWallet = await prisma.wallet.create({
            data: {
                user_id: userId,
                wallet_address: walletAddress,
                chain_id: chainId || 1,
                is_primary: true, // Default to primary for now
            },
        });

        res.json(newWallet);
    } catch (error) {
        console.error("Connect Wallet Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Disconnect Wallet
 */
export const disconnectWallet = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { walletAddress } = req.params;

        if (!userId || !walletAddress) {
            res.status(400).json({ message: "Wallet address is required" });
            return;
        }

        const wallet = await prisma.wallet.findUnique({
            where: { wallet_address: walletAddress },
        });

        if (!wallet || wallet.user_id !== userId) {
            res.status(404).json({ message: "Wallet not found for this user" });
            return;
        }

        await prisma.wallet.delete({
            where: { wallet_address: walletAddress },
        });

        res.json({ message: "Wallet disconnected successfully" });
    } catch (error) {
        console.error("Disconnect Wallet Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Generate MFA Setup
 * Generates a secret and QR code for the user to scan.
 */
export const generateMFASetup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { user_id: userId } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Generate a secret
        const secret = speakeasy.generateSecret({
            name: `SmartSukuk (${user.email})`,
        });

        if (!secret.base32 || !secret.otpauth_url) {
            res.status(500).json({ message: "Failed to generate MFA secret" });
            return;
        }

        // Store secret in DB (but validation pending)
        // We update the secret but keep is_enabled false until verified
        await prisma.mFASetting.upsert({
            where: { user_id: userId },
            update: {
                secret: secret.base32,
                is_enabled: false, // Ensure it's not enabled yet
            },
            create: {
                user_id: userId,
                secret: secret.base32,
                is_enabled: false,
                backup_codes: [],
            },
        });

        // Generate QR Code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,
            qrCodeUrl,
        });
    } catch (error) {
        console.error("Generate MFA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Verify MFA Setup
 * Verifies the token and enables MFA.
 */
export const verifyMFASetup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { token } = req.body;

        if (!userId || !token) {
            res.status(400).json({ message: "Token is required" });
            return;
        }

        const mfaSetting = await prisma.mFASetting.findUnique({
            where: { user_id: userId },
        });

        if (!mfaSetting || !mfaSetting.secret) {
            res.status(400).json({ message: "MFA setup not initiated" });
            return;
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: mfaSetting.secret,
            encoding: "base32",
            token: token,
        });

        if (!verified) {
            res.status(400).json({ message: "Invalid OTP code" });
            return;
        }

        // Enable MFA
        await prisma.mFASetting.update({
            where: { user_id: userId },
            data: { is_enabled: true },
        });

        res.json({ message: "MFA enabled successfully" });
    } catch (error) {
        console.error("Verify MFA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Toggle MFA (Disable only)
 */
export const toggleMFA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const { isEnabled } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (isEnabled) {
            res.status(400).json({ message: "Please use MFA setup flow to enable." });
            return;
        }

        // Disable MFA
        const mfa = await prisma.mFASetting.update({
            where: { user_id: userId },
            data: { is_enabled: false },
        });

        res.json(mfa);
    } catch (error) {
        console.error("Toggle MFA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
