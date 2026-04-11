"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, Building2, TrendingUp, LayoutGrid } from "lucide-react";
import InvestorPanel from "./investor/InvestorPanel";
import OwnerPanel from "./owner/OwnerPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";


export default function UnifiedDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Default to 'investor' so all users (including new ones) see Getting Started
    const [activeTab, setActiveTab] = useState<'investor' | 'owner'>('investor');

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get("/dashboard/user");
            setDashboardData(res.data);
        } catch (error) {
            console.error("Failed to load dashboard", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user) return router.push("/auth/login");
        if (user.role === 'regulator' || user.role === 'admin') return router.push("/dashboard/regulator");
        fetchDashboard();
    }, [user, authLoading, router, fetchDashboard]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!dashboardData) return <div className="text-center mt-20">Failed to load data.</div>;

    const { common, ownerData, investorData } = dashboardData;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* Global Alerts (MFA, KYC, etc.) */}
                {common.alerts && common.alerts.length > 0 && (
                    <div className="space-y-2">
                        {common.alerts.map((alert: any, idx: number) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border ${
                                    alert.type === 'error'
                                        ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                                }`}
                            >
                                <h4 className="font-bold text-sm mb-1">{alert.title || "Notice"}</h4>
                                <p className="text-sm">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab Toggle — always visible for all users */}
                <div className="flex gap-1 p-1 bg-muted/50 border border-border/50 rounded-lg w-fit mx-auto shadow-sm">
                    <Button
                        variant={activeTab === 'investor' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('investor')}
                        className="w-48 rounded-md transition-all"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Investments
                    </Button>
                    <Button
                        variant={activeTab === 'owner' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('owner')}
                        className="w-48 rounded-md transition-all"
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        My Properties
                    </Button>
                    <Link href="/dashboard/portfolio">
                        <Button
                            variant="ghost"
                            className="w-48 rounded-md transition-all"
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Portfolio
                        </Button>
                    </Link>
                </div>

                {/* Investor Panel — shown on investor tab. Includes Getting Started for new users. */}
                {activeTab === 'investor' && (
                    <div className="animate-fade-in">
                        <InvestorPanel
                            investorData={investorData}
                            commonData={common}
                            onRefresh={fetchDashboard}
                        />
                    </div>
                )}

                {/* Owner Panel — shown on owner tab. Handles its own empty state. */}
                {activeTab === 'owner' && (
                    <div className="animate-fade-in">
                        <OwnerPanel
                            ownerData={ownerData}
                            commonData={common}
                            onRefresh={fetchDashboard}
                        />
                    </div>
                )}
            </div>
            <Chatbot />
        </div>
    );
}