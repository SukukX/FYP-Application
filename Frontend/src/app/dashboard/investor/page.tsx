"use client";
/**
 * [PAGE] Investor Dashboard
 * -------------------------
 * Purpose: Portfolio management for investors.
 * Features:
 * - Stats: Total investment value, token counts.
 * - Visualizations: Portfolio distribution pie chart.
 * - Quick Actions: KYC submission, Wallet connection.
 */

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Wallet, Building2, Shield, XCircle, RefreshCw, ChevronRight, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { KYCWizard } from "@/components/KYCWizard";

export default function InvestorDashboard() {
    const { user: currentUser, setUser } = useAuth();
    // Initialize with currentUser status, but allow local updates from dashboard fetch
    const [kycStatus, setKycStatus] = useState<string>(currentUser?.kycStatus || 'not_submitted');

    // Sync with currentUser if it updates (e.g. on page reload)
    useEffect(() => {
        if (currentUser?.kycStatus) {
            setKycStatus(currentUser.kycStatus);
        }
    }, [currentUser]);

    const [stats, setStats] = useState({
        totalInvestment: 0,
        propertiesOwned: 0,
        totalTokens: 0
    });
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [holdings, setHoldings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
    const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
    const [existingKyc, setExistingKyc] = useState<any | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/dashboard/investor");
            setStats(res.data.stats);
            setPortfolio(res.data.portfolio);
            if (res.data.holdings) {
                setHoldings(res.data.holdings);
            }
            if (res.data.kycStatus) {
                setKycStatus(res.data.kycStatus);
                if (currentUser && currentUser.kycStatus !== res.data.kycStatus) {
                    setUser({ ...currentUser, kycStatus: res.data.kycStatus });
                }
            }
            setKycRejectionReason(res.data.kycRejectionReason || null);
            setExistingKyc(res.data.existingKyc || null);
            if (res.data.walletAddress) {
                setConnectedWallet(res.data.walletAddress);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate real 6-month growth trend using actual purchase dates and values
    const growthData = useMemo(() => {
        if (holdings.length === 0) return [];
        
        const data = [];
        const now = new Date();
        
        // Look back 6 months
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59); // End of that month
            
            // Calculate total current value of assets that were purchased on or before this target month
            const valueAtMonth = holdings.reduce((sum, h) => {
                const purchaseDate = new Date(h.purchase_date);
                if (purchaseDate <= targetDate) {
                    // We map the accumulation of their current portfolio value over time
                    return sum + (h.current_value || 0); 
                }
                return sum;
            }, 0);

            data.push({
                month: targetDate.toLocaleDateString("en-US", { month: "short" }),
                value: valueAtMonth
            });
        }
        return data;
    }, [holdings]);

    // Sort holdings by purchase date (newest first)
    const recentHoldings = [...holdings].sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

    const handleWalletConnect = async () => {
        if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            toast({
                title: "Invalid Address",
                description: "Please enter a valid Ethereum wallet address.",
                variant: "destructive",
            });
            return;
        }

        try {
            await api.post("/blockchain/wallet", { wallet: walletAddress });
            toast({
                title: "Wallet Connected",
                description: "Your wallet has been successfully connected.",
            });
            setWalletModalOpen(false);
            fetchDashboardData(); // Refresh to see any updates if applicable
        } catch (error: any) {
            toast({
                title: "Connection Failed",
                description: error.response?.data?.error || "Failed to connect wallet.",
                variant: "destructive",
            });
        }
    };

    const handleDisconnectWallet = async () => {
        if (!confirm("Are you sure you want to disconnect your wallet?")) return;
        try {
            await api.delete("/blockchain/wallet");
            toast({
                title: "Wallet Disconnected",
                description: "Your wallet has been removed successfully.",
            });
            setConnectedWallet(null);
            fetchDashboardData();
        } catch (error: any) {
            toast({
                title: "Disconnect Failed",
                description: error.response?.data?.error || "Failed to disconnect wallet.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-primary mb-2">Investor Dashboard</h1>
                            <p className="text-muted-foreground">Manage your tokenized real estate portfolio</p>
                        </div>
                        <Badge className={`${kycStatus === 'approved' ? 'bg-verified' : kycStatus === 'rejected' ? 'bg-destructive' : 'bg-pending'} text-primary-foreground`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {kycStatus === 'approved' ? 'KYC Verified' : kycStatus === 'rejected' ? 'KYC Rejected' : kycStatus === 'pending' ? 'KYC Pending' : 'KYC Not Submitted'}
                        </Badge>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="animate-slide-up">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">PKR {stats.totalInvestment.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.totalInvestment > 0 ? "Across your portfolio" : "No holdings yet"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Properties Owned</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.propertiesOwned}</div>
                            <p className="text-xs text-muted-foreground mt-1">Start investing today</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.totalTokens}</div>
                            <p className="text-xs text-muted-foreground mt-1">Browse marketplace</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Dashboard Portfolio Growth & Recent ── */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Growth Chart */}
                    <Card className="lg:col-span-2 overflow-hidden animate-slide-up">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-muted/20">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2 text-primary">
                                    <TrendingUp className="h-4 w-4" />
                                    Portfolio Growth
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">Estimated 6-month value trend</p>
                            </div>
                            <Link href="/dashboard/investor/portfolio">
                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs px-2">
                                    Detailed Analytics <ChevronRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {holdings.length === 0 ? (
                                <div className="h-[280px] flex items-center justify-center flex-col text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <TrendingUp className="h-6 w-6 text-muted-foreground/40" />
                                    </div>
                                    <p className="font-medium text-sm text-primary mb-1">No performance data</p>
                                    <p className="text-xs text-muted-foreground max-w-xs mb-4">You need to have active investments to see performance charts.</p>
                                    <Link href="/marketplace">
                                        <Button size="sm" variant="outline" className="h-8 text-xs">Browse Properties</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="h-[320px] w-full pt-4 pr-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                                                dy={15} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                                                tickFormatter={(val) => val >= 1000000 ? `PKR ${(val/1000000).toFixed(1)}M` : `PKR ${(val/1000).toFixed(0)}k`} 
                                                width={90}
                                                tickMargin={10}
                                            />
                                            <RechartsTooltip 
                                                formatter={(val: number) => [`PKR ${val.toLocaleString()}`, "Portfolio Value"]}
                                                contentStyle={{ borderRadius: "10px", fontSize: "13px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                                                labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))", marginBottom: "6px" }}
                                                itemStyle={{ fontWeight: 600, color: "hsl(var(--primary))" }}
                                            />
                                            <Area 
                                                type="linear" 
                                                dataKey="value" 
                                                stroke="hsl(var(--primary))" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorValue)" 
                                                activeDot={{ r: 7, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                                                dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))" }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Additions */}
                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="pb-4 border-b border-muted/20">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Recent Activity
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Your latest property investments</p>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {recentHoldings.length === 0 ? (
                                <div className="h-[240px] flex items-center justify-center flex-col text-center">
                                    <p className="text-sm text-muted-foreground mb-4">No recent activity.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentHoldings.slice(0, 4).map((h: any) => (
                                        <div key={h.investment_id} className="flex gap-3">
                                            <div className="mt-1 bg-accent/10 p-1.5 rounded-full h-fit flex-shrink-0">
                                                <Building2 className="h-3.5 w-3.5 text-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-sm font-medium text-primary truncate pr-2">{h.property_title}</p>
                                                    <span className="text-xs font-semibold whitespace-nowrap text-verified">+{h.tokens_owned} tk</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(h.purchase_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    </p>
                                                    <Link href={`/marketplace/${h.property_id}`}>
                                                        <button className="text-xs text-accent hover:underline flex items-center gap-0.5">
                                                            View Property
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {recentHoldings.length > 4 && (
                                        <div className="pt-2 text-center border-t border-border/50">
                                            <Link href="/dashboard/investor/portfolio">
                                                <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                                    View {recentHoldings.length - 4} more older investments
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Getting Started
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* KYC Tile Logic */}
                            {kycStatus === 'not_submitted' && (
                                <div className="flex items-start gap-4 p-4 border rounded-lg">
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <Shield className="h-5 w-5 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-primary mb-1">Complete KYC Verification</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Verify your identity to unlock buying and trading capabilities.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setKycModalOpen(true)}
                                        >
                                            Start Verification
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {kycStatus === 'pending' && (
                                <div className="flex items-start gap-4 p-4 border rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                                        <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-primary mb-1">Verification Pending</h3>
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">Under Review</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Your documents have been submitted and are currently being reviewed by our compliance team.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {kycStatus === 'rejected' && (
                                <div className="flex items-start gap-4 p-4 border rounded-lg bg-destructive/5 border-destructive/20">
                                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                        <XCircle className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-destructive mb-1">Verification Rejected</h3>
                                        {kycRejectionReason && (
                                            <p className="text-sm text-destructive/80 mb-1 font-medium">
                                                Reason: {kycRejectionReason}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Your previous documents are pre-loaded. Upload new ones only where needed.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 border-destructive/50 hover:bg-destructive/10 text-destructive"
                                            onClick={() => setKycModalOpen(true)}
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Resubmit KYC
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Wallet Tile */}
                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Wallet className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">
                                        {connectedWallet ? "Wallet Connected" : "Connect Your Wallet"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {connectedWallet
                                            ? `Linked: ${connectedWallet.substring(0, 6)}...${connectedWallet.substring(connectedWallet.length - 4)}`
                                            : "Link your Ethereum wallet to receive and manage security tokens."}
                                    </p>

                                    {connectedWallet ? (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-green-500 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20"
                                                disabled
                                            >
                                                Active
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={handleDisconnectWallet}
                                            >
                                                Disconnect
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setWalletModalOpen(true)}
                                        >
                                            Connect Wallet
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Browse Marketplace</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Explore verified property listings and start building your portfolio.
                                    </p>
                                    <Link href="/marketplace">
                                        <Button variant="outline" size="sm">
                                            View Properties
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KYC Wizard */}
            <KYCWizard
                open={kycModalOpen}
                onOpenChange={setKycModalOpen}
                existingKyc={kycStatus === 'rejected' ? existingKyc : null}
                onSuccess={() => {
                    fetchDashboardData();
                    toast({
                        title: "Verification Submitted",
                        description: "Your KYC documents have been submitted successfully.",
                    });
                }}
            />

            {/* Wallet Modal */}
            <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Your Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="walletAddress">Ethereum Wallet Address</Label>
                            <Input
                                id="walletAddress"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                placeholder="0x..."
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Enter your Ethereum wallet address to receive and manage your security tokens.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWalletModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleWalletConnect}>
                            Connect Wallet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Chatbot />
        </div>
    );
}
