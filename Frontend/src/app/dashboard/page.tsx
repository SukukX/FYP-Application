"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (user.role === 'investor') {
                    router.push("/dashboard/investor");
                } else if (user.role === 'owner') {
                    router.push("/dashboard/owner");
                } else if (user.role === 'regulator') {
                    router.push("/dashboard/regulator");
                } else {
                    router.push("/"); // Fallback if unknown role
                }
            } else {
                router.push("/auth/login");
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse">Redirecting to your dashboard...</div>
        </div>
    );
}
