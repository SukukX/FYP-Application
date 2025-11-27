import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function verifyDashboards() {
    console.log("Starting Dashboard Verification...");

    // 1. Register Users for each role
    const roles = ["investor", "owner", "regulator"];
    const tokens: { [key: string]: string } = {};

    for (const role of roles) {
        const email = `${role}${Date.now()}@example.com`;
        console.log(`\n1. Registering ${role}: ${email}`);
        try {
            const res = await axios.post(`${BASE_URL}/auth/register`, {
                name: `${role} User`,
                email,
                password: "password123",
                role,
                phone_number: "1234567890",
            });
            tokens[role] = res.data.token;
            console.log(`${role} registered & logged in.`);
        } catch (error: any) {
            console.error(`Failed to register ${role}:`, error.response?.data || error.message);
        }
    }

    // 2. Test Dashboard Endpoints
    console.log("\n2. Testing Dashboard Endpoints...");

    // Investor Dashboard
    try {
        console.log("-> Testing Investor Dashboard...");
        const res = await axios.get(`${BASE_URL}/dashboard/investor`, {
            headers: { Authorization: `Bearer ${tokens["investor"]}` },
        });
        console.log("Investor Stats:", res.data.stats);
        console.log("Investor Alerts:", res.data.alerts.length > 0 ? "YES" : "NO");
    } catch (error: any) {
        console.error("Investor Dashboard Failed:", error.response?.data || error.message);
    }

    // Owner Dashboard
    try {
        console.log("-> Testing Owner Dashboard...");
        const res = await axios.get(`${BASE_URL}/dashboard/owner`, {
            headers: { Authorization: `Bearer ${tokens["owner"]}` },
        });
        console.log("Owner Stats:", res.data.stats);
        console.log("Owner Alerts:", res.data.alerts.length > 0 ? "YES" : "NO");
    } catch (error: any) {
        console.error("Owner Dashboard Failed:", error.response?.data || error.message);
    }

    // Regulator Dashboard
    try {
        console.log("-> Testing Regulator Dashboard...");
        const res = await axios.get(`${BASE_URL}/dashboard/regulator`, {
            headers: { Authorization: `Bearer ${tokens["regulator"]}` },
        });
        console.log("Regulator Stats:", res.data.stats);
        console.log("Regulator Queues:", res.data.kycQueue.length, "KYC items");
    } catch (error: any) {
        console.error("Regulator Dashboard Failed:", error.response?.data || error.message);
    }
}

verifyDashboards().catch(console.error);
