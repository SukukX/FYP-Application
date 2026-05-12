import prisma from '../config/prisma';
import { Role } from '@prisma/client';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as speakeasy from "speakeasy";
import crypto from "crypto";
import { EmailService } from "./email.service";

const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
    async register(data: any) {
        const { name, email, password, phone_number, cnic, role, dob, files } = data;

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

        if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
        const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "5m" });

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: validRole,
                    phone_number: phone_number?.trim() || null,
                    cnic: validCnic,
                    dob: validDob,
                    is_active: validRole === Role.regulator ? false : true,
                    email_verification_token: verificationToken,
                },
            });

            return newUser;
        });

        // Send Verification Email (Async - don't block registration response if email fails)
        EmailService.sendVerificationEmail(email, name, verificationToken).catch(err => {
            console.error("Failed to send verification email:", err);
        });

        // Re-fetch user with KYC request for token generation
        const userWithKyc = await prisma.user.findUnique({
            where: { user_id: user.user_id },
            include: { kyc_request: true }
        });

        return this.generateToken(userWithKyc);
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

        if (!user.is_active && user.role !== Role.regulator) {
            throw new Error("Your account has been deactivated. Please contact support.");
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

    async verifyEmail(token: string) {
        if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
        
        try {
            // Verify token expiration and signature
            jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error("Verification link has expired or is invalid. Please request a new one.");
        }

        const user = await prisma.user.findFirst({
            where: { email_verification_token: token }
        });

        if (!user) {
            throw new Error("Invalid verification token.");
        }

        const updatedUser = await prisma.user.update({
            where: { user_id: user.user_id },
            data: {
                is_email_verified: true,
                email_verification_token: null
            }
        });

        // Send Welcome Email
        EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.name).catch(err => {
            console.error("Failed to send welcome email:", err);
        });

        return { message: "Email verified successfully!" };
    }

    async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Safety: don't reveal if user exists or not
            return { message: "If an account exists with that email, a reset link has been sent." };
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: {
                reset_password_token: resetToken,
                reset_password_expires: resetExpires
            }
        });

        EmailService.sendPasswordResetEmail(user.email, user.name, resetToken).catch(err => {
            console.error("Failed to send password reset email:", err);
        });

        return { message: "If an account exists with that email, a reset link has been sent." };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await prisma.user.findFirst({
            where: {
                reset_password_token: token,
                reset_password_expires: { gt: new Date() }
            }
        });

        if (!user) {
            throw new Error("Password reset token is invalid or has expired.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: {
                password: hashedPassword,
                reset_password_token: null,
                reset_password_expires: null
            }
        });

        return { message: "Password has been reset successfully!" };
    }

    async resendVerificationEmail(userId: number) {

        const user = await prisma.user.findUnique({ where: { user_id: userId } });
        if (!user) throw new Error("User not found.");
        if (user.is_email_verified) throw new Error("Email is already verified.");

        if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
        const verificationToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "5m" });

        await prisma.user.update({
            where: { user_id: userId },
            data: { email_verification_token: verificationToken }
        });

        EmailService.sendVerificationEmail(user.email, user.name, verificationToken).catch(err => {
            console.error("Failed to resend verification email:", err);
        });

        return { message: "A new verification email has been sent." };
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
            kycStatus: user.kyc_request?.status || "not_submitted",
            is_email_verified: !!user.is_email_verified
        };
        delete userResponse.password; // Safety first
        delete userResponse.mfa_setting; // Keep payload clean

        return { user: userResponse, token };
    }
}