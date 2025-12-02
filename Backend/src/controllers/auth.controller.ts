import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

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

export const login = async (req: Request, res: Response) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};
