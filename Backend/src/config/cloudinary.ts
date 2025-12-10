import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderName = 'smart-sukuk/uploads';

        // Determine folder based on file type/field name
        if (file.fieldname === 'images') {
            folderName = 'smart-sukuk/properties/images';
        } else if (file.fieldname === 'documents' || file.fieldname === 'proof') {
            folderName = 'smart-sukuk/properties/documents';
        } else if (file.fieldname === 'cnic_front' || file.fieldname === 'cnic_back' || file.fieldname === 'face_scan') {
            folderName = 'smart-sukuk/kyc';
        }

        // Sanitize public ID (remove special characters)
        const namePart = file.originalname.split('.').slice(0, -1).join('.');
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        const sanitizedName = namePart.replace(/[^a-zA-Z0-9]/g, "_");

        // Determine resource type based on mime type or field
        // Documents (pdfs, docs) should be 'raw' to ensure they are downloadable and not auto-converted to images incorrectly
        let resourceType = 'auto';
        let finalPublicId = sanitizedName + '-' + Date.now();
        let format = undefined;

        if (file.mimetype.startsWith('image/') || file.mimetype.includes('pdf')) {
            resourceType = 'image';
            if (extension) {
                format = extension;
            }
        } else {
            resourceType = 'raw';
            // IMPORTANT: For raw files, the public_id MUST include the extension, otherwise it is lost on download
            if (extension) {
                finalPublicId += `.${extension}`;
            }
        }

        return {
            folder: folderName,
            resource_type: resourceType,
            type: 'upload', // Explicitly public
            public_id: finalPublicId,
            format: format,
        };
    },
});

export default cloudinary;
