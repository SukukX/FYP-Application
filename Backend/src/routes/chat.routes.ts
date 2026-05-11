import { Router, Request, Response } from "express";
/**
 * [MODULE] Chat Routes
 * --------------------
 * Purpose: Proxy route to the Python RAG Chatbot microservice.
 * Forwards chat messages from the frontend to the FastAPI chatbot service.
 */
import axios from "axios";
import { AuthRequest, optionalAuth } from "../middleware/auth.middleware";
import { getChatbotUserContext } from "../services/chatbot.service";

const router = Router();

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || "http://localhost:8001";

/**
 * POST /api/chat
 * Proxies chat messages to the Python chatbot service.
 * Uses optional auth — works for both authenticated and unauthenticated users.
 */
router.post("/", optionalAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const { message, history, session_id } = req.body;

        if (!message || !message.trim()) {
            res.status(400).json({ message: "Message is required" });
            return;
        }

        // 1. Fetch personalized user context if logged in
        let userContext = "";
        if (authReq.user) {
            userContext = await getChatbotUserContext(authReq.user.user_id);
        }

        // Build the payload for the chatbot service
        const chatPayload = {
            message,
            history: history || [],
            session_id: session_id || "",
            is_authenticated: !!authReq.user,
            user_role: authReq.user?.role || "",
            user_context: userContext // Injected personalized context
        };

        // Forward to Python chatbot service
        const response = await axios.post(
            `${CHATBOT_SERVICE_URL}/chat`,
            chatPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    // Pass user info for rate limiting
                    ...(authReq.user ? { "X-User-Id": authReq.user.user_id.toString() } : {})
                },
                timeout: 60000 // 60s timeout (LLM can be slow)
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error("Chat Proxy Error:", error.message);

        if (error.response) {
            // Forward the error from chatbot service
            res.status(error.response.status).json(error.response.data);
        } else if (error.code === "ECONNREFUSED") {
            res.status(503).json({
                message: "Chatbot service is currently unavailable. Please try again later.",
                response: "I'm sorry, but I'm currently unavailable. Please try again in a moment."
            });
        } else {
            res.status(500).json({
                message: "Failed to process chat message",
                response: "I encountered an error processing your message. Please try again."
            });
        }
    }
});

/**
 * POST /api/chat/ingest
 * Triggers re-ingestion of the knowledge base (admin only).
 */
router.post("/ingest", async (req: Request, res: Response) => {
    try {
        const response = await axios.post(
            `${CHATBOT_SERVICE_URL}/ingest`,
            {},
            { timeout: 120000 } // 2 min timeout for ingestion
        );
        res.json(response.data);
    } catch (error: any) {
        console.error("Ingest Proxy Error:", error.message);
        res.status(500).json({ message: "Failed to trigger ingestion" });
    }
});

/**
 * GET /api/chat/health
 * Health check for the chatbot service.
 */
router.get("/health", async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${CHATBOT_SERVICE_URL}/health`, {
            timeout: 5000
        });
        res.json(response.data);
    } catch (error: any) {
        res.status(503).json({ status: "unavailable", message: "Chatbot service is down" });
    }
});

export default router;
