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

export default app;