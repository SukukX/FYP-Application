import { Request, Response } from "express";
/**
 * [MODULE] Auth Controller
 * ------------------------
 * Purpose: Handles Authentication requests.
 * Logic: Delegates complex business logic (hashing, JWT generation) to 'AuthService'.
 */
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

/**
 * [ACTION] Register User
 * Flow: Frontend Form -> Validate Body -> Create User (DB) -> Return User Data
 */
export const register = async (req: Request, res: Response) => {
    try {
        // Pass both body and files to the service
        const result = await authService.register({
            ...req.body,
            files: (req as any).files
        });
        res.status(201).json(result);
    } catch (error: any) {
        // console.error("Register Error:", error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * [ACTION] Login User
 * Flow: Frontend Form -> Validate Creds -> Generate JWT -> Return Token + User Info
 */
export const login = async (req: Request, res: Response) => {
    try {
        const result = await authService.login(req.body);

        if ((result as any).mfaRequired) {
            res.status(200).json({ mfaRequired: true, message: "MFA Code Required" });
            return;
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

/**
 * [ACTION] Verify Email
 * Flow: User clicks email link -> GET /verify-email?token=... -> Mark verified (DB)
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token) throw new Error("Verification token is required.");
        
        const result = await authService.verifyEmail(token as string);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * [ACTION] Forgot Password
 * Flow: User enters email -> POST /forgot-password -> Generate & send reset link
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error("Email is required.");
        const result = await authService.requestPasswordReset(email);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * [ACTION] Reset Password
 * Flow: User enters new password -> POST /reset-password -> Update password (DB)
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token) throw new Error("Reset token is required.");
        if (!password) throw new Error("New password is required.");
        
        const result = await authService.resetPassword(token, password);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * [ACTION] Resend Verification Email
 * Flow: User clicks resend -> POST /resend-verification -> Generate & send new token (DB)
 */
export const resendVerification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.user_id;
        if (!userId) throw new Error("Unauthorized");
        
        const result = await authService.resendVerificationEmail(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
