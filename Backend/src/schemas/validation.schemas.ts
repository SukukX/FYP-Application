import { z } from "zod";

// Re-defining here to ensure Backend has a stable local copy
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const cnicSchema = z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must follow the format XXXXX-XXXXXXX-X");

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    mfaCode: z.string().length(6, "MFA code must be 6 digits").or(z.literal("")).optional(),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    phone_number: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format").or(z.literal("")).optional(),
    dob: z.string().refine((val) => {
        const date = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        return age >= 18;
    }, "You must be at least 18 years old"),
    cnic: cnicSchema,
    role: z.enum(["user", "regulator"]),
});

export const propertyListingSchema = z.object({
    title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title too long"),
    location: z.string().min(5, "Valid address is required"),
    property_type: z.enum(["residential", "commercial", "industrial"]),
    description: z.string().min(20, "Description must be at least 20 characters"),
    valuation: z.preprocess((val) => Number(val), z.number().positive("Valuation must be a positive number")),
    total_tokens: z.preprocess((val) => Number(val), z.number().int().positive("Total tokens must be a positive integer")),
    tokens_for_sale: z.preprocess((val) => Number(val), z.number().int().positive("Tokens for sale must be positive")),
});

export const kycSubmissionSchema = z.object({
    cnic_number: cnicSchema,
    cnic_expiry: z.string().refine((val) => {
        const date = new Date(val);
        const minExpiry = new Date();
        minExpiry.setMonth(minExpiry.getMonth() + 3);
        return date > minExpiry;
    }, "CNIC must be valid for at least 3 months"),
});
