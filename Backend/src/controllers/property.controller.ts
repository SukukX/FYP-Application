import { Response } from "express";
import { PrismaClient, PropertyType, VerificationStatus, VerificationStatusDoc, ListingStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Configure Multer for Property Documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, "../../uploads");
        if (file.fieldname === "images") {
            uploadPath = path.join(uploadPath, "properties/images");
        } else {
            uploadPath = path.join(uploadPath, "properties/documents");
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

export const uploadPropertyDocs = multer({ storage: storage });

// Create Property Draft
export const createProperty = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const {
            title,
            location,
            description,
            property_type,
            valuation,
            total_tokens,
            price_per_token,
            isDraft
        } = req.body;

        const property = await prisma.property.create({
            data: {
                owner_id: userId,
                title,
                location,
                description,
                property_type: property_type as PropertyType,
                valuation: parseFloat(valuation),
                verification_status: isDraft === 'true' ? VerificationStatus.draft : VerificationStatus.pending,
                listing_status: ListingStatus.hidden, // Default to hidden until approved and made live
            },
        });

        // Create initial Sukuk offering
        await prisma.sukuk.create({
            data: {
                property_id: property.property_id,
                total_tokens: parseInt(total_tokens),
                available_tokens: parseInt(total_tokens),
                token_price: parseFloat(price_per_token),
                status: "active"
            }
        });

        res.status(201).json(property);
    } catch (error) {
        console.error("Create Property Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Upload Documents for Property
export const uploadDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const propertyId = parseInt(req.params.id);

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const property = await prisma.property.findUnique({
            where: { property_id: propertyId },
        });

        if (!property || property.owner_id !== userId) {
            res.status(404).json({ message: "Property not found or unauthorized" });
            return;
        }

        const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || (Object.keys(files).length === 0)) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }

        const uploadedDocs = [];

        // Handle Images
        if (files['images']) {
            for (const file of files['images']) {
                const doc = await prisma.document.create({
                    data: {
                        property_id: propertyId,
                        file_name: file.originalname,
                        file_type: file.mimetype, // or 'image'
                        file_path: `/uploads/properties/images/${file.filename}`,
                        file_hash: "pending_hash",
                        verification_status: VerificationStatusDoc.pending,
                    },
                });
                uploadedDocs.push(doc);
            }
        }

        // Handle Legal Documents
        if (files['documents']) {
            for (const file of files['documents']) {
                const doc = await prisma.document.create({
                    data: {
                        property_id: propertyId,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        file_path: `/uploads/properties/documents/${file.filename}`,
                        file_hash: "pending_hash",
                        verification_status: VerificationStatusDoc.pending,
                    },
                });
                uploadedDocs.push(doc);
            }
        }

        res.json({ message: "Files uploaded successfully", documents: uploadedDocs });
    } catch (error) {
        console.error("Upload Documents Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Submit for Verification
export const submitForVerification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        const propertyId = parseInt(req.params.id);

        const property = await prisma.property.findUnique({
            where: { property_id: propertyId },
        });

        if (!property || property.owner_id !== userId) {
            res.status(404).json({ message: "Property not found or unauthorized" });
            return;
        }

        const updated = await prisma.property.update({
            where: { property_id: propertyId },
            data: { verification_status: VerificationStatus.pending },
        });

        res.json({ message: "Property submitted for verification", property: updated });
    } catch (error) {
        console.error("Submit Verification Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get My Properties
export const getMyProperties = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const properties = await prisma.property.findMany({
            where: { owner_id: userId },
            include: { documents: true },
        });

        res.json(properties);
    } catch (error) {
        console.error("Get My Properties Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Regulator: Verify Property
// Regulator: Verify Property
export const verifyProperty = async (req: AuthRequest, res: Response) => {
    try {
        const { status, remarks } = req.body; // approved, rejected
        const propertyId = parseInt(req.params.id);
        const regulatorId = req.user?.user_id;

        if (!regulatorId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!["approved", "rejected"].includes(status)) {
            res.status(400).json({ message: "Invalid status" });
            return;
        }

        const updated = await prisma.property.update({
            where: { property_id: propertyId },
            data: { verification_status: status as VerificationStatus },
        });

        // Create Verification Log
        await prisma.verificationLog.create({
            data: {
                property_id: propertyId,
                regulator_id: regulatorId,
                status: status === "approved" ? "approved" : "rejected",
                comments: remarks || null,
            }
        });

        res.json({ message: `Property ${status}`, property: updated });
    } catch (error) {
        console.error("Verify Property Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Owner: Update Listing Status (e.g. Make Live)
export const updateListingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body; // active, hidden, suspended
        const propertyId = parseInt(req.params.id);
        const userId = req.user?.user_id;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const property = await prisma.property.findUnique({
            where: { property_id: propertyId },
        });

        if (!property || property.owner_id !== userId) {
            res.status(404).json({ message: "Property not found or unauthorized" });
            return;
        }

        if (property.verification_status !== "approved") {
            res.status(400).json({ message: "Property must be approved before going live" });
            return;
        }

        // If trying to unlive (hide/suspend), check if tokens are sold
        if (status !== "active") {
            const sukuk = await prisma.sukuk.findFirst({
                where: { property_id: propertyId }
            });

            if (sukuk && sukuk.total_tokens !== sukuk.available_tokens) {
                res.status(400).json({ message: "Cannot unlive listing: Tokens have already been sold" });
                return;
            }
        }

        const updated = await prisma.property.update({
            where: { property_id: propertyId },
            data: { listing_status: status },
        });

        res.json({ message: `Listing status updated to ${status}`, property: updated });
    } catch (error) {
        console.error("Update Listing Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Owner: Delete Property (Draft only)
export const deleteProperty = async (req: AuthRequest, res: Response) => {
    try {
        const propertyId = parseInt(req.params.id);
        const userId = req.user?.user_id;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const property = await prisma.property.findUnique({
            where: { property_id: propertyId },
        });

        if (!property || property.owner_id !== userId) {
            res.status(404).json({ message: "Property not found or unauthorized" });
            return;
        }

        if (property.verification_status !== "draft") {
            res.status(400).json({ message: "Only draft properties can be deleted" });
            return;
        }

        // Delete related records first (if any)
        await prisma.sukuk.deleteMany({ where: { property_id: propertyId } });
        await prisma.document.deleteMany({ where: { property_id: propertyId } });

        await prisma.property.delete({
            where: { property_id: propertyId },
        });

        res.json({ message: "Property draft deleted successfully" });
    } catch (error) {
        console.error("Delete Property Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
