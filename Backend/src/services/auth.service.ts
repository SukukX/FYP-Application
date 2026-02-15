import { PrismaClient, User, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
    async register(data: any) {
        const { name, email, password, role, phone_number, cnic } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("User already exists");
        }

        if (cnic) {
            const existingCnic = await prisma.user.findUnique({ where: { cnic } });
            if (existingCnic) {
                throw new Error("CNIC already exists");
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
                phone_number,
                cnic, // Assuming CNIC is provided at registration or handled later
            },
        });

        return this.generateToken(user);
    }

    async login(data: any) {
        const { email, password, mfaCode } = data;

        // Include mfa_setting in query to check status
        const user = await prisma.user.findUnique({
            where: { email },
            include: { mfa_setting: true }
        });

        const user = await prisma.user.findUnique({
            where: { email },
            include: { kyc_request: true }
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

        return { user: userResponse, token };
    }
}
