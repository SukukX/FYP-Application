import request from "supertest";
// import { describe,beforeAll } from "node:test";
import app from "../src/app"; 
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Secondary Market Exchange API", () => {
    let sellerToken: string;
    let buyerToken: string;
    let testSukukId = 2;
    let testListingId: number;

    // NOTE: For this to work, you need to grab real JWT tokens from your DB 
    // or mock the auth middleware. Assume sellerToken and buyerToken are valid JWTs.
    beforeAll(async () => {
        // Setup: Ensure database is reachable
        await prisma.$connect();
        sellerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6Im93bmVyQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc1MzQ0NjA1LCJleHAiOjE3NzU0MzEwMDV9.h7dwkjyqWpLfve-DFvdZpAqcsb3Mh765Ywrz6613Bjc"; 
        buyerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6ImludmVzdG9yQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc1MzQ0NTkwLCJleHAiOjE3NzU0MzA5OTB9.Ylgc7CghcEpmt55_q8owO_k_S_X0aPTP6sdvvvEMCd0";
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("POST /api/exchange/listings", () => {
        it("should PREVENT listing if user is not KYC verified", async () => {
            const res = await request(app)
                .post("/api/exchange/listings")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ sukuk_id: testSukukId, token_amount: 10, total_asking_price: 1000 });
            
            // Adjust based on if your test user has KYC or not
            expect(res.status).toBe(403); 
        });

        it("should PREVENT listing more tokens than the user owns", async () => {
            const res = await request(app)
                .post("/api/exchange/listings")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ sukuk_id: testSukukId, token_amount: 9999999, total_asking_price: 500000 });
            
            expect(res.status).toBe(400);
            expect(res.body.message).toContain("unlocked tokens available");
        });

        it("should successfully CREATE a valid listing", async () => {
            const res = await request(app)
                .post("/api/exchange/listings")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ sukuk_id: testSukukId, token_amount: 5, total_asking_price: 5000 });
            
            expect(res.status).toBe(201);
            expect(res.body.listing).toHaveProperty("listing_id");
            testListingId = res.body.listing.listing_id; // Save for the next tests
        });

        it("should PREVENT double-listing (over-committing locked tokens)", async () => {
            // Assuming the user only had 5 tokens total, and just listed them above.
            const res = await request(app)
                .post("/api/exchange/listings")
                .set("Authorization", `Bearer ${sellerToken}`)
                .send({ sukuk_id: testSukukId, token_amount: 99999999, total_asking_price: 1000 });
            
            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/exchange/listings/:id/buy", () => {
        it("should PREVENT a user from buying their own listing", async () => {
            const res = await request(app)
                .post(`/api/exchange/listings/${testListingId}/buy`)
                .set("Authorization", `Bearer ${sellerToken}`); // Using SELLER token intentionally
            
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("You cannot buy your own listing.");
        });

        it("should EXECUTE a valid P2P trade", async () => {
            // Increase timeout because Hardhat blockchain interactions take a few seconds
            const res = await request(app)
                .post(`/api/exchange/listings/${testListingId}/buy`)
                .set("Authorization", `Bearer ${buyerToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("txHash");
            expect(res.body.message).toBe("Trade executed successfully!");
        }, 15000); // 15-second timeout for blockchain buffer
    });
});