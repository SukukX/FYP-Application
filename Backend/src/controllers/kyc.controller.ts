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
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { cnic_number, cnic_expiry } = req.body;
        // Cast req to any to access files, or extend AuthRequest interface
        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || !files.cnic_front || !files.cnic_back) {
            res.status(400).json({ message: "CNIC front and back images are required" });
            return;
        }

        // Check if KYC already exists
        const existingKYC = await prisma.kYCRequest.findUnique({
            where: { user_id: userId },
        });

        if (existingKYC && existingKYC.status === "approved") {
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
            const updatedKYC = await prisma.kYCRequest.update({
                where: { user_id: userId },
                data: kycData,
            });
            res.json(updatedKYC);
        } else {
            // Create new request
            const newKYC = await prisma.kYCRequest.create({
                data: kycData,
            });
            res.status(201).json(newKYC);
        }
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

/**
 * [ACTION] Approve KYC
 * Updates status to 'approved'.
 */
export const approveKYC = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;
        const regulatorId = req.user?.user_id;

        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }

        const kyc = await prisma.kYCRequest.update({
            where: { user_id: userId },
            data: {
                status: KYCStatus.approved,
                reviewed_by: regulatorId,
                reviewed_at: new Date(),
                rejection_reason: null // Clear previous rejection reasons
            },
        });

        // Also update the User table if needed, but currently relation-based
        // Could trigger notifications here

        res.json(kyc);
    } catch (error) {
        console.error("KYC Approve Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * [ACTION] Reject KYC
 * Updates status to 'rejected' and logs reason.
 */
export const rejectKYC = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, comments } = req.body;
        const regulatorId = req.user?.user_id;

        if (!userId || !comments) {
            res.status(400).json({ message: "User ID and comments are required" });
            return;
        }

        const kyc = await prisma.kYCRequest.update({
            where: { user_id: userId },
            data: {
                status: KYCStatus.rejected,
                rejection_reason: comments,
                reviewed_by: regulatorId,
                reviewed_at: new Date(),
            },
        });

        // Notify user via notification system
        await prisma.notification.create({
            data: {
                user_id: userId,
                type: "verification",
                message: `Your KYC verification was rejected. Reason: ${comments}`,
            }
        });

        res.json(kyc);
    } catch (error) {
        console.error("KYC Reject Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
