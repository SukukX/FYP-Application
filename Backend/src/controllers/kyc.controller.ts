import { Request, Response } from "express";
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
            // Update existing request (e.g., resubmission)
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
