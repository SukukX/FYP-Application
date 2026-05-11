import express from "express";
/**
 * [MODULE] Application Entry Point (App)
 * --------------------------------------
 * Purpose: Main Express application configuration.
 * Functionality:
 * - Aggregates all route modules (Auth, User, Property, etc.).
 * - Sets up global middleware (CORS, Helmet, Body Parser).
 * - Serves static uploads for local development.
 * 
 * Flow: Request -> Global Middleware -> Route Module -> Controller -> Response
 */
import dotenv from "dotenv";

// Load env vars before other imports
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import path from "path";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import kycRoutes from "./routes/kyc.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import propertyRoutes from "./routes/property.routes";
import mfaRoutes from "./routes/mfa.routes";
import settingsRoutes from "./routes/settings.routes";
import blockchainRoutes from "./routes/blockchain.routes";
import rentRoutes from "./routes/rent.routes";
import priceRoutes from "./routes/price.routes";
import transactionRoutes from "./routes/transaction.routes";
import exchangeRoutes from "./routes/exchange.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/exchange",exchangeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let message = err.message || "An unexpected server error occurred";
    
    // Format "File size too large" messages from bytes to MB for better UX
    if (message.includes("File size too large")) {
        const bytesRegex = /(\d+)/g;
        const matches = message.match(bytesRegex);
        if (matches && matches.length >= 2) {
            const gotMB = (parseInt(matches[0]) / (1024 * 1024)).toFixed(2);
            const limitMB = (parseInt(matches[1]) / (1024 * 1024)).toFixed(2);
            message = `File size too large. Max allowed ${limitMB} MB.`;
        }
    }

    console.error("Global Error Log:", {
        message: message,
        http_code: err.http_code,
        details: err
    });

    const statusCode = err.http_code || err.status || 500;
    
    res.status(statusCode).json({ 
        success: false,
        message: message, 
        error: err.name || "InternalError"
    });
});

export default app;