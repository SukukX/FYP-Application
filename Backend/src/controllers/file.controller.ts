import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../config/prisma';

export const getSecureFile = async (req: AuthRequest, res: Response) => {
    try {
        const { url } = req.query;
        const user = req.user;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ message: "URL is required" });
        }

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Authorization checks
        if (user.role === 'user') {
            const kycMatch = await prisma.kYCRequest.findFirst({
                where: {
                    user_id: user.user_id,
                    OR: [
                        { cnic_front: { contains: url } },
                        { cnic_back: { contains: url } },
                        { face_scan: { contains: url } }
                    ]
                }
            });

            let propertyMatch = null;
            if (!kycMatch) {
                propertyMatch = await prisma.document.findFirst({
                    where: {
                        file_path: { contains: url },
                        property: { owner_id: user.user_id }
                    }
                });
            }

            if (!kycMatch && !propertyMatch) {
                return res.status(403).json({ message: "Forbidden: You do not have access to this document." });
            }
        }

        if (url.includes('/upload/')) {
            return res.redirect(url);
        }

        if (url.includes('/private/')) {
            const isRaw = url.includes('/raw/');
            const parts = url.split('/private/');
            if (parts.length < 2) return res.status(400).json({ message: "Invalid URL" });

            let afterPrivate = parts[1];
            
            // Strip signature if present (s--xyz--)
            if (afterPrivate.startsWith('s--')) {
                afterPrivate = afterPrivate.substring(afterPrivate.indexOf('/') + 1);
            }
            
            // Strip version if present (v1234)
            if (afterPrivate.match(/^v\d+\//)) {
                afterPrivate = afterPrivate.substring(afterPrivate.indexOf('/') + 1);
            }

            let publicId = afterPrivate;
            let format = '';

            const extIndex = afterPrivate.lastIndexOf('.');
            if (extIndex !== -1) {
                format = afterPrivate.substring(extIndex + 1);
                // For raw files uploaded with extension, Cloudinary might still want the extension stripped for the public_id param of private_download_url
                publicId = afterPrivate.substring(0, extIndex);
            }

            const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
                expires_at: Math.floor(Date.now() / 1000) + 900,
                resource_type: isRaw ? 'raw' : 'image'
            });

            return res.redirect(signedUrl);
        }

        return res.redirect(url);
    } catch (error) {
        console.error("Secure File Proxy Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
