// app.ts

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import kycRoutes from "./routes/kyc.routes";
import marketplaceRoutes from "./routes/marketplace.routes";
import propertyRoutes from "./routes/property.routes";
import mfaRoutes from "./routes/mfa.routes";
import settingsRoutes from "./routes/settings.routes";

dotenv.config();
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/settings", settingsRoutes);

export default app;