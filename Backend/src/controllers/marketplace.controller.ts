import { Request, Response } from "express";
import { PrismaClient, PropertyType } from "@prisma/client";

const prisma = new PrismaClient();

export const getListings = async (req: Request, res: Response) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;

        const where: any = {
            verification_status: { in: ["live", "approved"] },
        };

        if (location) {
            where.location = { contains: location as string, mode: "insensitive" };
        }

        if (type) {
            where.property_type = type as PropertyType;
        }

        if (minPrice || maxPrice) {
            where.valuation = {};
            if (minPrice) where.valuation.gte = parseFloat(minPrice as string);
            if (maxPrice) where.valuation.lte = parseFloat(maxPrice as string);
        }

        const properties = await prisma.property.findMany({
            where,
            include: {
                documents: {
                    where: { verification_status: "verified" }, // Only show verified docs
                    select: { file_path: true, file_type: true }
                }
            }
        });

        res.json(properties);
    } catch (error) {
        console.error("Get Listings Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPropertyDetails = async (req: Request, res: Response) => {
    try {
        const propertyId = parseInt(req.params.id);

        const property = await prisma.property.findUnique({
            where: { property_id: propertyId },
            include: {
                documents: true,
                sukuks: true, // Show associated tokens
            },
        });

        if (!property) {
            res.status(404).json({ message: "Property not found" });
            return;
        }

        res.json(property);
    } catch (error) {
        console.error("Get Property Details Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
