import prisma from '../config/prisma';
import { Role } from '@prisma/client';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as speakeasy from "speakeasy";

const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
    async register(data: any) {
        const { name, email, password, phone_number, cnic, role, dob } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("User already exists with this email.");
        }

        const validCnic = cnic?.trim() || null;
        if (validCnic) {
            const existingCnic = await prisma.user.findUnique({ where: { cnic: validCnic } });
            if (existingCnic) {
                throw new Error("User already exists with this CNIC.");
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const validRole = role === "regulator" ? Role.regulator : Role.user;
        
        let validDob = null;
        if (dob) {
            const parsedDob = new Date(dob);
            if (!isNaN(parsedDob.getTime())) {
                validDob = parsedDob;
            }
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: validRole,
                phone_number: phone_number?.trim() || null,
                cnic: validCnic,
                dob: validDob,
            },
        });

        return this.generateToken(user);
    }

    async login(data: any) {
        const { email, password, mfaCode } = data;

        // OPTIMIZATION: Combined MFA and KYC includes into a single database hit
        const user = await prisma.user.findUnique({
            where: { email },
            include: { 
                mfa_setting: true,
                kyc_request: true 
            }
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }

        // Check MFA
        if (user.mfa_setting?.is_enabled) {
            if (!mfaCode) {
                // Signal controller that MFA is required
                return { mfaRequired: true };
            }

            // Verify Code
            const verified = speakeasy.totp.verify({
                secret: user.mfa_setting.secret!,
                encoding: "base32",
                token: mfaCode,
                window: 1 // Allow 30s slack
            });

            if (!verified) {
                throw new Error("Invalid MFA Code");
            }
        }

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Return flat user object with kycStatus
        const userResponse = {
            ...user,
            kycStatus: user.kyc_request?.status || "not_submitted"
        };
        delete userResponse.password; // Safety first
        delete userResponse.mfa_setting; // Keep payload clean

        return { user: userResponse, token };
    }
}