import { Request, Response } from "express";
import { PrismaClient, PropertyType } from "@prisma/client";

const prisma = new PrismaClient();

export const getListings = async (req: Request, res: Response) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;

        const where: any = {
            verification_status: "approved",
            listing_status: "active",
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
                    select: { file_path: true, file_type: true }
                },
                sukuks: true
            }
        });

        const formattedProperties = properties.map(p => {
            const sukuk = p.sukuks[0];
            return {
                id: p.property_id,
                title: p.title,
                address: p.location,
                valuation: parseFloat(p.valuation.toString()),
                description: p.description,
                property_type: p.property_type,
                images: p.documents.filter(d => d.file_type.startsWith("image")).map(d => d.file_path),
                total_tokens: sukuk ? sukuk.total_tokens : 0,
                tokens_available: sukuk ? sukuk.available_tokens : 0,
                price_per_token: sukuk ? parseFloat(sukuk.token_price.toString()) : 0,
                created_at: p.created_at
            };
        });

        res.json(formattedProperties);
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
                sukuks: true,
                verification_logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            },
        });

        if (!property) {
            res.status(404).json({ message: "Property not found" });
            return;
        }

        // Format response for frontend
        const p = property as any; // Cast to any to avoid TS issues with included relations

        const images = p.documents
            .filter((d: any) => d.file_type.startsWith("image"))
            .map((d: any) => d.file_path);

        const documents = p.documents
            .filter((d: any) => !d.file_type.startsWith("image"))
            .map((d: any) => ({
                name: d.file_name,
                path: d.file_path,
                type: d.file_type
            }));

        const regulatorComments = p.verification_logs.length > 0
            ? p.verification_logs[0].comments
            : "No comments available";

        const formattedProperty = {
            ...property,
            images,
            documents,
            regulatorComments
        };

        console.log("Formatted Property Response:", JSON.stringify(formattedProperty, null, 2));

        res.json(formattedProperty);
    } catch (error) {
        console.error("Get Property Details Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
