import request from "supertest";
import app from "../src/app"; 
import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const prisma = new PrismaClient();
jest.setTimeout(15000);
describe("Core System & Dashboard API Tests", () => {
    // Replace these with actual valid JWTs for your test environment
    let standardUserToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6ImludmVzdG9yQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc1MzQ0NTkwLCJleHAiOjE3NzU0MzA5OTB9.Ylgc7CghcEpmt55_q8owO_k_S_X0aPTP6sdvvvEMCd0"; 
    let regulatorToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6InJlZ3VsYXRvckBnbWFpbC5jb20iLCJyb2xlIjoicmVndWxhdG9yIiwiaWF0IjoxNzc1MzQ1MjIzLCJleHAiOjE3NzU0MzE2MjN9.g0o4RN-t6kRVxe6HFTgN4c0EiwuoW9-vDUMuyLvIFY8";
    let unverifiedUserToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwiZW1haWwiOiIwMG5nYWk4ZnVAbW96bWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NTM0NjY2OSwiZXhwIjoxNzc1NDMzMDY5fQ.qSiINClyeRb092aFgSsHO6RUn21HD3Ut_fQQeqqdEu8"; // A user with no KYC and no wallet

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // ==========================================
    // 1. UNIFIED DASHBOARD TESTS
    // ==========================================
    describe("GET /api/dashboard/user", () => {
        it("should REJECT requests with no authentication token", async () => {
            const res = await request(app).get("/api/dashboard/user");
            expect(res.status).toBe(401);
        });

        it("should successfully return the Unified User Dashboard payload", async () => {
            const res = await request(app)
                .get("/api/dashboard/user")
                .set("Authorization", `Bearer ${standardUserToken}`);
            
            expect(res.status).toBe(200);
            
            // Check for our exact unified structure
            expect(res.body).toHaveProperty("role", "user");
            expect(res.body).toHaveProperty("summary");
            expect(res.body).toHaveProperty("common");
            expect(res.body).toHaveProperty("ownerData");
            expect(res.body).toHaveProperty("investorData");

            // Ensure investments array exists for the UI
            expect(Array.isArray(res.body.investorData.investments)).toBe(true);
        });

        it("should flag missing KYC and Wallet in the 'common' alerts payload", async () => {
            const res = await request(app)
                .get("/api/dashboard/user")
                .set("Authorization", `Bearer ${unverifiedUserToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.common.kycStatus).toBe("not_submitted");
            expect(res.body.common.walletAddress).toBeNull();
            
            // Alert system should have generated a warning
            const hasKycWarning = res.body.common.alerts.some(
                (alert: any) => alert.type === "warning" && alert.message.includes("KYC")
            );
            expect(hasKycWarning).toBe(true);
        });
    });

    // ==========================================
    // 2. REGULATOR DASHBOARD TESTS (Security)
    // ==========================================
    describe("GET /api/regulator/dashboard", () => {
        it("should ALLOW access to users with the Regulator role", async () => {
            const res = await request(app)
                .get("/api/regulator/dashboard")
                .set("Authorization", `Bearer ${regulatorToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("role", "regulator");
            expect(res.body).toHaveProperty("stats");
            expect(res.body).toHaveProperty("kycQueue");
            expect(res.body).toHaveProperty("listingQueue");
        });

        it("should FORBID access to standard users trying to view Regulator data", async () => {
            const res = await request(app)
                .get("/api/regulator/dashboard")
                .set("Authorization", `Bearer ${standardUserToken}`);
            
            // Should be 403 Forbidden (or 401/404 depending on your exact middleware setup)
            expect(res.status).toBeGreaterThanOrEqual(401); 
            expect(res.body).not.toHaveProperty("kycQueue"); // Crucial: Ensure data didn't leak!
        });
    });

    // ==========================================
    // 3. WALLET CONNECTION TESTS
    // ==========================================
    describe("POST & DELETE /api/blockchain/wallet", () => {
        const testWallet = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";

        it("should REJECT an invalid Ethereum wallet address format", async () => {
            const res = await request(app)
                .post("/api/blockchain/wallet")
                .set("Authorization", `Bearer ${standardUserToken}`)
                .send({ wallet: "0xINVALID_WALLET_STRING_123" });
            
            expect(res.status).toBe(400); // Bad Request
        });

        it("should CONNECT a valid wallet address successfully", async () => {
            const res = await request(app)
                .post("/api/blockchain/wallet")
                .set("Authorization", `Bearer ${standardUserToken}`)
                .send({ wallet: testWallet });
            
            expect(res.status).toBe(200);
            
            // Verify via dashboard that it actually saved
            const dashRes = await request(app)
                .get("/api/dashboard/user")
                .set("Authorization", `Bearer ${standardUserToken}`);
            
            expect(dashRes.body.common.walletAddress).toBe(testWallet);
        });

        it("should DISCONNECT the wallet successfully", async () => {
            const res = await request(app)
                .delete("/api/blockchain/wallet")
                .set("Authorization", `Bearer ${standardUserToken}`);
            
            expect(res.status).toBe(200);

            // Verify via dashboard that it is gone
            const dashRes = await request(app)
                .get("/api/dashboard/user")
                .set("Authorization", `Bearer ${standardUserToken}`);
            
            expect(dashRes.body.common.walletAddress).toBeNull();
        });
    });
});