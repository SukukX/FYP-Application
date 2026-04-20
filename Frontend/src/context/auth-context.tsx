"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
    user_id: number;
    name: string;
    email: string;
    role: string;
    phone_number?: string;
    country?: string;
    address?: string;
    dob?: string | Date; // API might return string or Date object
    profile_pic?: string;
    kyc_request?: {
        status: string;
    };
    created_at?: string | Date;
    kycStatus?: string; // Legacy or alternative
    walletAddress?: string;
    mfa_setting?: {
        is_enabled: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => void;
    // setUser: (user: User | null) => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get("token");
            if (token) {
                try {
                    // Fetch user profile if token exists
                    const res = await api.get("/users/profile");
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth check failed:", error);
                    Cookies.remove("token");
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    
    const login = async (token: string, userData: User) => {
        Cookies.set("token", token, { expires: 7 });

        try {
            // ALWAYS fetch fresh user from backend
            const res = await api.get("/users/profile");

            setUser(res.data);
        } catch (error) {
            console.error("Failed to fetch user after login:", error);
            setUser(userData); // fallback only
        }

        // Redirect based on role (use fetched OR fallback)
        const role = userData.role;

        if (role === "user") {
            router.push("/dashboard");
        } else if (role === "regulator") {
            router.push("/dashboard/regulator");
        } else {
            router.push("/dashboard");
        }
    };

    const logout = () => {
        Cookies.remove("token");
        setUser(null);
        router.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
