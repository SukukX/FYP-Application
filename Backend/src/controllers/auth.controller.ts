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
        // console.log("Register Request Body:", req.body);
        const result = await authService.register(req.body);
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
