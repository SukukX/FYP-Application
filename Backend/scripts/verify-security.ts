import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const BASE_URL = "http://localhost:5000/api";

async function verifySecurity() {
    console.log("Starting Security Verification...");

    // 1. Register & Login
    const uniqueEmail = `sec${Date.now()}@example.com`;
    console.log(`\n1. Registering user: ${uniqueEmail}`);

    try {
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: "Security Test User",
            email: uniqueEmail,
            password: "password123",
            role: "investor",
            phone_number: "1234567890",
        });

        const token = registerRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log("User registered & logged in.");

        // 2. MFA Flow
        console.log("\n2. Testing MFA Generation...");
        const mfaRes = await axios.post(`${BASE_URL}/mfa/generate`, {}, { headers });
        console.log("MFA Secret generated:", mfaRes.data.secret ? "YES" : "NO");

        // 3. Settings Check
        console.log("\n3. Checking Settings (Initial)...");
        const settingsRes = await axios.get(`${BASE_URL}/settings`, { headers });
        console.log("MFA Enabled:", settingsRes.data.security.mfaEnabled);
        console.log("KYC Status:", settingsRes.data.verification.status);

        // 4. KYC Submission
        console.log("\n4. Testing KYC Submission...");

        // Create dummy files
        const dummyPath = path.join(__dirname, "dummy.jpg");
        fs.writeFileSync(dummyPath, "dummy content");

        const form = new FormData();
        form.append("cnic_number", "42101-1234567-1");
        form.append("cnic_expiry", "2030-01-01");
        form.append("cnic_front", fs.createReadStream(dummyPath));
        form.append("cnic_back", fs.createReadStream(dummyPath));

        const kycRes = await axios.post(`${BASE_URL}/kyc/submit`, form, {
            headers: {
                ...headers,
                ...form.getHeaders(),
            },
        });

        console.log("KYC Submission Status:", kycRes.status);
        console.log("KYC Status Response:", kycRes.data.status);

        // Cleanup dummy file
        fs.unlinkSync(dummyPath);

        if (kycRes.status === 201 || kycRes.status === 200) {
            console.log("\nSUCCESS: Security modules verified!");
        } else {
            console.error("\nFAILURE: KYC submission failed.");
        }

    } catch (error: any) {
        console.error("Verification Failed:", error.response?.data || error.message);
    }
}

verifySecurity().catch(console.error);
