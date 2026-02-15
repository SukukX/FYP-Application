import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as priceService from "../services/price.service";

export const requestUpdate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.user_id!;
        const { propertyId, newValuation, newTokenPrice, justification } = req.body;

        const request = await priceService.requestPriceUpdate(
            userId,
            Number(propertyId),
            Number(newValuation),
            Number(newTokenPrice),
            justification
        );

        res.status(201).json(request);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const reviewUpdate = async (req: AuthRequest, res: Response) => {
    try {
        const regulatorId = req.user?.user_id!;
        const { requestId, approve, comments } = req.body;

        const result = await priceService.reviewPriceUpdate(
            regulatorId,
            Number(requestId),
            approve,
            comments
        );

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { propertyId } = req.params;
        const history = await priceService.getPriceHistory(Number(propertyId));
        res.json(history);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
