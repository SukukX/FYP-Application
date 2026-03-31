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

        // Check if KYC already exists
        const existingKYC = await prisma.kYCRequest.findUnique({
            where: { user_id: userId },
        });

        // For new submissions, front and back are required
        // For resubmissions (existingKYC present), they are optional (keep old if not provided)
        if (!existingKYC && (!files || !files.cnic_front || !files.cnic_back)) {
            console.log("[KYC] Validation Error: Missing Files for new submission");
            res.status(400).json({ message: "CNIC front and back images are required" });
            return;
        }

        if (existingKYC && existingKYC.status === "approved") {
            console.log("[KYC] Already Approved");
            res.status(400).json({ message: "KYC already approved" });
            return;
        }

        // Build update data — preserve old files if no new ones uploaded
        const kycData = {
            user_id: userId,
            cnic_number: cnic_number || existingKYC?.cnic_number,
            cnic_expiry: cnic_expiry ? new Date(cnic_expiry) : (existingKYC?.cnic_expiry ?? new Date()),
            cnic_front: files?.cnic_front?.[0]?.path || existingKYC?.cnic_front || "",
            cnic_back: files?.cnic_back?.[0]?.path || existingKYC?.cnic_back || "",
            face_scan: files?.face_scan?.[0]?.path || existingKYC?.face_scan || null,
            status: KYCStatus.pending,
            submitted_at: new Date(),
        };

        if (existingKYC) {
            // [LOGIC] Resubmission — update with preserved or new data
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
        const regulatorRole = req.user?.role as string;
        const { userId } = req.body;

        if (!regulatorId) return res.status(401).json({ message: "Unauthorized" });

        // Idempotency guard: pre-fetch current KYC state
        const existingKyc = await prisma.kYCRequest.findUnique({
            where: { user_id: Number(userId) },
            include: { user: { select: { name: true } } }
        });
        if (!existingKyc) return res.status(404).json({ message: "KYC record not found" });
        if (existingKyc.status === KYCStatus.approved) {
            return res.json({ message: "KYC is already approved. No changes made.", data: existingKyc });
        }

        // [TRANSACTION] Atomically update KYC status + write audit log
        const [kyc] = await prisma.$transaction(async (tx) => {
            // 1. Name snapshot reused from pre-fetch (saves a query inside transaction)
            const targetUser = existingKyc.user;

            // 2. Update KYC status
            const updatedKyc = await tx.kYCRequest.update({
                where: { user_id: Number(userId) },
                data: {
                    status: KYCStatus.approved,
                    reviewed_by: regulatorId,
                    reviewed_at: new Date(),
                    rejection_reason: null
                },
            });

            // 3. Write audit log atomically
            await tx.auditLog.create({
                data: {
                    user_id: regulatorId,
                    actorRole: regulatorRole === 'admin' ? 'ADMIN' : 'REGULATOR',
                    module: 'KYC',
                    action: 'APPROVED',
                    targetId: Number(userId),
                    targetName: targetUser?.name || 'Unknown',
                    details: { comments: 'KYC approved by regulator' },
                    ip_address: req.ip || null,
                }
            });

            return [updatedKyc];
        });

        // [BLOCKCHAIN INTEGRATION] Auto-Whitelist if wallet exists
        const userWallet = await prisma.wallet.findFirst({
            where: { user_id: Number(userId), is_primary: true }
        });

        if (userWallet) {
            try {
                console.log(`[KYC Approval] Whitelisting wallet ${userWallet.wallet_address}...`);
                const blockchainService = require("../services/blockchain.service");
                await blockchainService.addToWhitelist(userWallet.wallet_address);
                console.log(`[KYC Approval] Whitelist Success.`);
            } catch (err: any) {
                console.error(`[KYC Approval] Whitelist Failed:`, err.message);
            }
        }

        // Send notification (outside transaction — non-critical)
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
        const regulatorRole = req.user?.role as string;
        const { userId, reason, comments } = req.body;
        const rejectionReason = reason || comments;

        if (!regulatorId) return res.status(401).json({ message: "Unauthorized" });
        if (!rejectionReason) return res.status(400).json({ message: "Rejection reason is required" });

        // Idempotency guard: pre-fetch current KYC state
        const existingKyc = await prisma.kYCRequest.findUnique({
            where: { user_id: Number(userId) },
            include: { user: { select: { name: true } } }
        });
        if (!existingKyc) return res.status(404).json({ message: "KYC record not found" });
        if (existingKyc.status === KYCStatus.rejected && existingKyc.rejection_reason === rejectionReason) {
            return res.json({ message: "KYC is already rejected with the same reason. No changes made." });
        }

        // [TRANSACTION] Atomically update KYC status + write audit log
        await prisma.$transaction(async (tx) => {
            // 1. Name snapshot reused from pre-fetch
            const targetUser = existingKyc.user;

            // 2. Update KYC status
            await tx.kYCRequest.update({
                where: { user_id: Number(userId) },
                data: {
                    status: KYCStatus.rejected,
                    reviewed_by: regulatorId,
                    reviewed_at: new Date(),
                    rejection_reason: rejectionReason
                },
            });

            // 3. Write audit log atomically
            await tx.auditLog.create({
                data: {
                    user_id: regulatorId,
                    actorRole: regulatorRole === 'admin' ? 'ADMIN' : 'REGULATOR',
                    module: 'KYC',
                    action: 'REJECTED',
                    targetId: Number(userId),
                    targetName: targetUser?.name || 'Unknown',
                    details: { reason: rejectionReason },
                    ip_address: req.ip || null,
                }
            });
        });

        // Send notification (outside transaction — non-critical)
        await prisma.notification.create({
            data: {
                user_id: Number(userId),
                type: "verification",
                message: `Your KYC verification was REJECTED. Reason: ${rejectionReason}`
            }
        });

        res.json({ message: "KYC Rejected" });
    } catch (error: any) {
        console.error("KYC Reject Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
