import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from "supertest";
import app from "../src/app"; 
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

describe("Property Creation & Math Enforcement API", () => {
    let ownerToken: string;
    let testPropertyId: number;
    const dummyImagePath = path.join(__dirname, "demo.jpg");

    beforeAll(async () => {
        await prisma.$connect();
        
        // PASTE A VALID OWNER JWT HERE
        ownerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6Im93bmVyMUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NTk0NDI3NywiZXhwIjoxNzc2MDMwNjc3fQ.NDzGHeiQdKxiP-JLfp1RWMFH5CffkQs-b_p8_kp1zlQ"; 

        // // Create a temporary dummy file so Multer doesn't crash during the upload phase
        // fs.writeFileSync(dummyImagePath, "fake image content for testing");
    });

    // afterAll(async () => {
    //     // Clean up the dummy file and database connection
    //     if (fs.existsSync(dummyImagePath)) {
    //         fs.unlinkSync(dummyImagePath);
    //     }
    //     await prisma.$disconnect();
    // });

    it("should successfully create a property and OVERRIDE bad frontend math", async () => {
        // We are using the exact data from your mockListings array
        const res = await request(app)
            .post("/api/properties")
            .set("Authorization", `Bearer ${ownerToken}`)
            .field("title", "Premium Commercial Plaza - Backend Math Test")
            .field("location", "F-7 Markaz, Islamabad")
            .field("description", "Testing if backend calculates token price securely.")
            .field("property_type", "commercial")
            .field("valuation", "50000000") // 50 Million PKR
            .field("total_tokens", "1000")  // 1000 Tokens
            .field("isDraft", "false")
            // --- THE POISON PILLS (The frontend trying to hack the system) ---
            .field("price_per_token", "999999") 
            .field("tokens_for_sale", "1")
            // -----------------------------------------------------------------
            // .attach("images", dummyImagePath); // Simulate file upload

        // 1. Ensure the API accepted the request
        console.log("CRASH REASON:", res.body);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("property_id");
        testPropertyId = res.body.property_id;

        // 2. THE ULTIMATE PROOF: Query the database directly to check the Sukuk math
        const sukuk = await prisma.sukuk.findFirst({
            where: { property_id: testPropertyId }
        });

        // Ensure Sukuk was actually created
        expect(sukuk).not.toBeNull();

        // Check 1: Did it calculate 50,000 (50M / 1000) instead of trusting 999,999?
        const actualTokenPrice = parseFloat(sukuk!.token_price.toString());
        expect(actualTokenPrice).toBe(50000); 

        // Check 2: Did it enforce genesis capacity (1000 available) instead of trusting 1?
        expect(sukuk!.available_tokens).toBe(1000);
        expect(sukuk!.total_tokens).toBe(1000);
    },30000);
});