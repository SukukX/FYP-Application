import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function verifyAuth() {
    console.log("Starting Verification...");

    // 1. Register
    const uniqueEmail = `test${Date.now()}@example.com`;
    const uniqueCnic = `42101${Date.now().toString().slice(-8)}`; // Mock CNIC

    console.log(`\n1. Testing Registration with email: ${uniqueEmail}`);
    try {
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: "Test User",
            email: uniqueEmail,
            password: "password123",
            role: "investor",
            phone_number: "1234567890",
            country: "Pakistan",
            cnic: uniqueCnic
        });

        console.log("Register Status:", registerRes.status);
        console.log("Register Response:", JSON.stringify(registerRes.data, null, 2));

        if (registerRes.status !== 201) {
            console.error("Registration Failed!");
            return;
        }

        // 2. Login
        console.log("\n2. Testing Login...");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: uniqueEmail,
            password: "password123",
        });

        console.log("Login Status:", loginRes.status);

        if (loginRes.status !== 200) {
            console.error("Login Failed!");
            return;
        }

        const token = loginRes.data.token;
        console.log("Token received:", token ? "YES" : "NO");

        // 3. Get Profile
        console.log("\n3. Testing Get Profile...");
        const profileRes = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`
            },
        });

        console.log("Profile Status:", profileRes.status);
        console.log("Profile Response:", JSON.stringify(profileRes.data, null, 2));

        if (profileRes.status === 200) {
            console.log("\nSUCCESS: All checks passed!");
        } else {
            console.error("\nFAILURE: Profile check failed.");
        }

    } catch (error: any) {
        console.error("Verification Failed:", error.response?.data || error.message);
    }
}

verifyAuth().catch(console.error);
