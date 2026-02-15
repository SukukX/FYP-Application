import { Request, Response } from "express";
/**
 * [MODULE] KYC Controller
 * -----------------------
 * Purpose: Handles Identity Verification requests.
 * Features:
 * - Document Upload: Stores files in Cloudinary.
 * - State Management: Tracks status (Pending/Approved/Rejected).
 */
import { PrismaClient, KYCStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../config/cloudinary";

const prisma = new PrismaClient();


// Configure Multer for Cloudinary storage
export const upload = multer({ storage: storage });

export const submitKYC = async (req: AuthRequest, res: Response) => {
    console.log("[KYC] Submit Request Received");
    try {
        const userId = req.user?.user_id;
        console.log(`[KYC] User ID: ${userId}, Role: ${req.user?.role}`);

        if (!userId) {
            console.log("[KYC] Unauthorized: No User ID");
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { cnic_number, cnic_expiry } = req.body;
        // Cast req to any to access files, or extend AuthRequest interface
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        console.log(`[KYC] Files Received:`, files ? Object.keys(files) : "None");

        if (!files || !files.cnic_front || !files.cnic_back) {
            console.log("[KYC] Validation Error: Missing Files");
            res.status(400).json({ message: "CNIC front and back images are required" });
            return;
        }

        // Check if KYC already exists
        const existingKYC = await prisma.kYCRequest.findUnique({
            where: { user_id: userId },
        });

        if (existingKYC && existingKYC.status === "approved") {
            console.log("[KYC] Already Approved");
            res.status(400).json({ message: "KYC already approved" });
            return;
        }

        const kycData = {
            user_id: userId,
            cnic_number,
            cnic_expiry: new Date(cnic_expiry),
            cnic_front: files.cnic_front[0].path, // Cloudinary URL
            cnic_back: files.cnic_back[0].path, // Cloudinary URL
            face_scan: files.face_scan ? files.face_scan[0].path : null, // Cloudinary URL
            status: KYCStatus.pending,
            submitted_at: new Date(),
        };

        if (existingKYC) {
            // [LOGIC] Resubmission
            // If rejected previously, allow update. If approved, blocked by earlier check.
            console.log("[KYC] Updating existing request");
            const updatedKYC = await prisma.kYCRequest.update({
                where: { user_id: userId },
                data: kycData,
            });
            res.json(updatedKYC);
        } else {
            // Check if CNIC is already used by ANOTHER user
            const cnicConflict = await prisma.kYCRequest.findUnique({
                where: { cnic_number: cnic_number }
            });

            if (cnicConflict) {
                console.log(`[KYC] Conflict: CNIC ${cnic_number} already used by User ${cnicConflict.user_id}`);
                res.status(400).json({ message: "This CNIC is already registered with another account." });
                return;
            }

            // Create new request
            console.log("[KYC] Creating new request");
            const newKYC = await prisma.kYCRequest.create({
                data: kycData,
            });
            res.status(201).json(newKYC);
        }
        console.log("[KYC] Submission Successful");
    } catch (error) {
        console.error("KYC Submit Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getKYCStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const kyc = await prisma.kYCRequest.findUnique({
            where: { user_id: userId },
        });

        if (!kyc) {
            res.json({ status: "not_submitted" });
            return;
        }

        res.json(kyc);
    } catch (error) {
        console.error("KYC Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const approveKYC = async (req: AuthRequest, res: Response) => {
    try {
        const regulatorId = req.user?.user_id;
        const { userId } = req.body;

        if (!regulatorId) return res.status(401).json({ message: "Unauthorized" });

        const kyc = await prisma.kYCRequest.update({
            where: { user_id: Number(userId) },
            data: {
                status: KYCStatus.approved,
                reviewed_by: regulatorId,
                reviewed_at: new Date(),
                rejection_reason: null
            },
        });

        // [BLOCKCHAIN INTEGRATION] Auto-Whitelist if wallet exists
        // -------------------------------------------------------
        const userWallet = await prisma.wallet.findFirst({
            where: { user_id: Number(userId), is_primary: true }
        });

        if (userWallet) {
            try {
                console.log(`[KYC Approval] Whitelisting wallet ${userWallet.wallet_address}...`);
                // Dynamic import to avoid circular dependency if service imports controller (unlikely but safe)
                const blockchainService = require("../services/blockchain.service");
                await blockchainService.addToWhitelist(userWallet.wallet_address);
                console.log(`[KYC Approval] Whitelist Success.`);
            } catch (err: any) {
                console.error(`[KYC Approval] Whitelist Failed:`, err.message);
                // Don't fail the HTTP request, just log it.
            }
        } else {
            console.log(`[KYC Approval] No wallet found for user. verify when they connect wallet.`);
        }

        // Create notification
        await prisma.notification.create({
            data: {
                user_id: Number(userId),
                type: "verification",
                message: "Your KYC verification has been APPROVED. You can now invest in properties."
            }
        });

        res.json({ message: "KYC Approved & Whitelisted", data: kyc });
    } catch (error: any) {
        console.error("KYC Approve Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const rejectKYC = async (req: AuthRequest, res: Response) => {
    try {
        const regulatorId = req.user?.user_id;
        const { userId, reason, comments } = req.body;
        const rejectionReason = reason || comments;

        if (!regulatorId) return res.status(401).json({ message: "Unauthorized" });

        const kyc = await prisma.kYCRequest.update({
            where: { user_id: Number(userId) },
            data: {
                status: KYCStatus.rejected,
                reviewed_by: regulatorId,
                reviewed_at: new Date(),
                rejection_reason: rejectionReason
            },
        });

        // Create notification
        await prisma.notification.create({
            data: {
                user_id: Number(userId),
                type: "verification",
                message: `Your KYC verification was REJECTED. Reason: ${rejectionReason}`
            }
        });

        res.json({ message: "KYC Rejected", data: kyc });
    } catch (error: any) {
        console.error("KYC Reject Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
