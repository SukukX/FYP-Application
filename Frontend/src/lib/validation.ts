import { z } from "zod";

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include one uppercase letter")
    .regex(/[a-z]/, "Include one lowercase letter")
    .regex(/[0-9]/, "Include one number")
    .regex(/[^A-Za-z0-9]/, "Include one special character");

export const cnicSchema = z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "Format: XXXXX-XXXXXXX-X");

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    mfaCode: z.string().length(6, "MFA code must be 6 digits").or(z.literal("")).optional(),
});

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone_number: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Invalid phone number format").or(z.literal("")).optional(),
    dob: z.string().refine((val) => {
        const date = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        return age >= 18;
    }, "You must be at least 18 years old"),
    cnic: cnicSchema,
    role: z.enum(["user", "regulator"]),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const propertyListingSchema = z.object({
    title: z.string().min(10, "Min 10 characters").max(100, "Too long"),
    location: z.string().min(5, "Address required"),
    property_type: z.enum(["residential", "commercial", "industrial"]),
    description: z.string().min(20, "Min 20 characters"),
    valuation: z.preprocess((val) => Number(val), z.number().positive("Must be positive")),
    total_tokens: z.preprocess((val) => Number(val), z.number().int().positive("Must be positive integer")),
    tokens_for_sale: z.preprocess((val) => Number(val), z.number().int().positive("Must be positive")),
    price_per_token: z.string().optional(), // Auto-calculated in UI, not validated strictly
}).refine((data) => data.tokens_for_sale <= data.total_tokens, {
    message: "Cannot exceed total tokens",
    path: ["tokens_for_sale"],
});

export const kycSubmissionSchema = z.object({
    cnic_number: cnicSchema,
    cnic_expiry: z.string().refine((val) => {
        const date = new Date(val);
        const minExpiry = new Date();
        minExpiry.setMonth(minExpiry.getMonth() + 3);
        return date > minExpiry;
    }, "Must be valid for at least 3 months"),
});
