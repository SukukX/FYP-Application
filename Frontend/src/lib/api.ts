import axios from "axios";
/**
 * [UTILITY] Axios API Client
 * --------------------------
 * Purpose: Centralized HTTP client for all Frontend API requests.
 * Features:
 * - Base URL configuration.
 * - Automatic Authorization Header injection (Bearer Token).
 * - Global Error Handling (Auto-logout on 401 Unauthorized).
 */
import Cookies from "js-cookie";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// ==========================================
// Request Interceptor
// Action: Injects 'Authorization: Bearer <token>' into every request.
// Source: 'token' cookie (set by Login page)
// ==========================================
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// Response Interceptor
// Action: Global Error Handling
// Logic: If Backend returns 401 (Unauthorized), user is logged out & redirected.
// ==========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove("token");
            if (typeof window !== "undefined") {
                window.location.href = "/auth/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
