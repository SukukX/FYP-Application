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
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
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

    const login = (token: string, userData: User) => {
        Cookies.set("token", token, { expires: 7 }); // 7 days
        setUser(userData);

        // Redirect based on role
        if (userData.role === 'investor') {
            router.push("/dashboard/investor");
        } else if (userData.role === 'owner') {
            router.push("/dashboard/owner");
        } else if (userData.role === 'regulator') {
            router.push("/dashboard/regulator");
        } else {
            router.push("/dashboard"); // Fallback
        }
    };

    const logout = () => {
        Cookies.remove("token");
        setUser(null);
        router.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
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
