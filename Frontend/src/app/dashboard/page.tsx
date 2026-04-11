"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, Building2, TrendingUp } from "lucide-react"; // Added icons
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
    
    // NEW: State to track which tab the user is currently looking at
    const [activeTab, setActiveTab] = useState<'owner' | 'investor'>('owner');

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get("/dashboard/user");
            setDashboardData(res.data);
            
            // Smart default: If they are only an investor, default to the investor tab
            if (!res.data.summary.isOwner && res.data.summary.isInvestor) {
                setActiveTab('investor');
            }
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

    const { summary, common, ownerData, investorData } = dashboardData;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-8 space-y-8">
                
                {/* 1. Global Alerts (MFA, KYC, etc.) */}
                {common.alerts && common.alerts.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {common.alerts.map((alert: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-lg border ${
                                alert.type === 'error' 
                                ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                                <h4 className="font-bold text-sm mb-1">{alert.title || "Notice"}</h4>
                                <p className="text-sm">{alert.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* THE NEW TAB NAVIGATION */}
                {summary.isOwner && summary.isInvestor && (
                    <div className="flex gap-1 p-1 bg-muted/50 border border-border/50 rounded-lg w-fit mx-auto mb-8 shadow-sm">
                        <Button 
                            variant={activeTab === 'owner' ? 'default' : 'ghost'} 
                            onClick={() => setActiveTab('owner')}
                            className="w-48 rounded-md transition-all"
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            Property Management
                        </Button>
                        <Button 
                            variant={activeTab === 'investor' ? 'default' : 'ghost'} 
                            onClick={() => setActiveTab('investor')}
                            className="w-48 rounded-md transition-all"
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Investment Portfolio
                        </Button>
                    </div>
                )}

                {/* CONDITIONAL RENDERING BASED ON TABS */}
                
                {/* Show Owner Panel if they own properties AND the Owner tab is active */}
                {summary.isOwner && activeTab === 'owner' && (
                    <div className="animate-fade-in">
                        <OwnerPanel ownerData={ownerData} commonData={common} onRefresh={fetchDashboard}/>
                    </div>
                )}

                {/* Show Investor Panel if they are an investor AND the Investor tab is active */}
                {summary.isInvestor && activeTab === 'investor' && (
                    <div className="animate-fade-in">
                        <InvestorPanel investorData={investorData} commonData={common} onRefresh={fetchDashboard} />
                    </div>
                )}

                {/* 5. The Empty State (Brand New User) */}
                {!summary.isOwner && !summary.isInvestor && (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border mt-8">
                        <h2 className="text-2xl font-bold text-primary mb-2">Welcome to your Dashboard!</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            You haven't made any investments or listed any properties yet. Choose how you want to get started below.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/marketplace">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Browse Marketplace
                                </Button>
                            </Link>
                            <Link href="/dashboard/owner/listings/new">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    Tokenize a Property
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
            <Chatbot />
        </div>
    );
}