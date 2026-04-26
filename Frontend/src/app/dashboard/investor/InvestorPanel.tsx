"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Wallet, Building2, Shield, ArrowRightLeft, Loader2, Clock, XCircle, RefreshCw, ChevronRight, Banknote } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as PieTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip } from "recharts";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { KYCWizard } from "@/components/KYCWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InvestorPanel({ investorData, commonData, onRefresh }: { investorData: any, commonData: any, onRefresh: () => void }) {

    const stats = investorData?.stats || { totalInvestment: 0, propertiesOwned: 0, totalTokens: 0, totalYieldEarned: 0 };
    const portfolio = investorData?.portfolio || [];
    const investments = investorData?.investments || [];
    const holdings = investorData?.holdings || [];

    const kycStatus = commonData?.kycStatus || 'not_submitted';
    const kycRejectionReason = commonData?.kycRejectionReason || null;
    const existingKyc = commonData?.existingKyc || null;
    const connectedWallet = commonData?.walletAddress || null;

    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");

    const [sellModalOpen, setSellModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
    // const [askingPrice, setPricePerToken] = useState("");
    // const [isListing, setIsListing] = useState(false);
    const [tokenAmount, setTokenAmount] = useState("");
    const [pricePerToken, setPricePerToken] = useState("");
    const [daysValid, setDaysValid] = useState("30");
    const [isListing, setIsListing] = useState(false);

    const { toast } = useToast();

    const growthData = useMemo(() => {
        if (holdings.length === 0) return [];
        const data = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const valueAtMonth = holdings.reduce((sum: number, h: any) => {
                const purchaseDate = new Date(h.purchase_date);
                if (purchaseDate <= targetDate) {
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
            onRefresh();
        } catch (error: any) {
            toast({
                title: "Connection Failed",
                description: error.response?.data?.error || "Failed to connect wallet.",
                variant: "destructive",
            });
        }
    };

    // The missing logic to send data to the backend
    const handleCreateListing = async () => {
        setIsListing(true);
        try {
            // Sends the payload to our new Partial Selling API
            await api.post("/exchange/listings", {
                sukuk_id: selectedInvestment.sukuk_id,
                token_amount: parseInt(tokenAmount),
                price_per_token: parseFloat(pricePerToken),
                days_valid: parseInt(daysValid)
            });

            toast({ title: "Success", description: "Tokens listed on the secondary market!" });
            setSellModalOpen(false);
            onRefresh();
        } catch (error: any) {
            toast({
                title: "Listing Failed",
                description: error.response?.data?.message || "Failed to create listing.",
                variant: "destructive"
            });
        } finally {
            setIsListing(false);
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
            onRefresh();
        } catch (error: any) {
            toast({
                title: "Disconnect Failed",
                description: error.response?.data?.error || "Failed to disconnect wallet.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in mb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">Investment Portfolio</h1>
                    <p className="text-muted-foreground">Manage your tokenized real estate investments</p>
                </div>
                <Badge className={`${kycStatus === 'approved' ? 'bg-verified' : kycStatus === 'rejected' ? 'bg-destructive' : 'bg-pending'} text-primary-foreground`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {kycStatus === 'approved' ? 'KYC Verified' : kycStatus === 'rejected' ? 'KYC Rejected' : kycStatus === 'pending' ? 'KYC Pending' : 'KYC Not Submitted'}
                </Badge>
            </div>

            {/* <div className="grid md:grid-cols-3 gap-6">
                <Card>
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

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Properties Owned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.propertiesOwned}</div>
                        <p className="text-xs text-muted-foreground mt-1">Start investing today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.totalTokens}</div>
                        <p className="text-xs text-muted-foreground mt-1">Browse marketplace</p>
                    </CardContent>
                </Card>
            </div> */}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
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

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Properties Owned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.propertiesOwned}</div>
                        <p className="text-xs text-muted-foreground mt-1">Start investing today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.totalTokens}</div>
                        <p className="text-xs text-muted-foreground mt-1">Browse marketplace</p>
                    </CardContent>
                </Card>

                {/* NEW: Yield Earned Card */}
                <Card className="border-green-500/20 bg-green-50/10 dark:bg-green-900/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Total Yield Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            PKR {(stats.totalYieldEarned || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Passive income from rent</p>
                    </CardContent>
                </Card>
            </div>
            {/* Area Chart & Recent Additions - Restored from User's Backup */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-muted/20">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <TrendingUp className="h-4 w-4" />
                                Portfolio Growth
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Estimated 6-month value trend</p>
                        </div>
                        <Link href="/dashboard/portfolio">
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
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} tickFormatter={(val) => val >= 1000000 ? `PKR ${(val / 1000000).toFixed(1)}M` : `PKR ${(val / 1000).toFixed(0)}k`} width={90} tickMargin={10} />
                                        <AreaTooltip formatter={(val: number) => [`PKR ${val.toLocaleString()}`, "Portfolio Value"]} contentStyle={{ borderRadius: "10px", fontSize: "13px", border: "1px solid hsl(var(--border))" }} itemStyle={{ fontWeight: 600, color: "hsl(var(--primary))" }} />
                                        <Area type="linear" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))" }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Additions */}
                <Card>
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
                                        <Link href="/dashboard/portfolio">
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

            {/* Active Investments List & Secondary Market Triggers - Preserved from unified branch */}
            {investments && investments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Your Active Investments (Exchange)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {investments.map((inv: any, idx: number) => (
                                <div key={idx} className="flex flex-col sm:flex-row justify-between items-center p-4 border border-border/50 rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors">
                                    <div className="w-full sm:w-auto mb-4 sm:mb-0">
                                        <h4 className="font-semibold text-primary text-lg">
                                            {inv.sukuk?.property?.title || `Property Asset #${inv.sukuk_id}`}
                                        </h4>
                                        <div className="flex gap-4 mt-1">
                                            <p className="text-sm text-muted-foreground">Tokens Owned: <span className="font-medium text-foreground">{inv.tokens_owned}</span></p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6">
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-muted-foreground">Original Value</p>
                                            <p className="font-bold text-accent">PKR {Number(inv.purchase_value).toLocaleString()}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="border-primary/20 hover:border-primary/50"
                                            onClick={() => {
                                                setSelectedInvestment(inv);
                                                setPricePerToken("");
                                                setSellModalOpen(true);
                                            }}
                                        >
                                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                                            List on Exchange
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Getting Started - Preserving rich UI from HEAD */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Getting Started Checklist
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {kycStatus === 'not_submitted' && (
                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Shield className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Complete KYC Verification</h3>
                                    <p className="text-sm text-muted-foreground mb-2">Verify your identity to unlock buying and trading capabilities.</p>
                                    <Button variant="outline" size="sm" onClick={() => setKycModalOpen(true)}>Start Verification</Button>
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
                                    <p className="text-sm text-muted-foreground mb-2">Your documents have been submitted and are under review.</p>
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
                                        <p className="text-sm text-destructive/80 mb-1 font-medium">Reason: {kycRejectionReason}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground mb-2">Your previous documents are pre-loaded. Upload new ones only where needed.</p>
                                    <Button variant="outline" size="sm" className="gap-1 border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={() => setKycModalOpen(true)}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Resubmit KYC
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <Wallet className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-primary mb-1">
                                    {connectedWallet ? "Wallet Connected" : "Connect Your Wallet"}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {connectedWallet ? `Linked: ${connectedWallet.substring(0, 6)}...${connectedWallet.substring(connectedWallet.length - 4)}` : "Link your Ethereum wallet to receive proceeds."}
                                </p>
                                {connectedWallet ? (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="border-green-500 text-green-600 bg-green-50" disabled>Active</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDisconnectWallet}>Disconnect</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setWalletModalOpen(true)}>Connect Wallet</Button>
                                )}
                            </div>
                        </div>

                        {investments.length === 0 && (
                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Browse Marketplace</h3>
                                    <p className="text-sm text-muted-foreground mb-2">Explore verified property listings and start building your portfolio.</p>
                                    <Link href="/marketplace">
                                        <Button variant="outline" size="sm">View Properties</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <KYCWizard open={kycModalOpen} onOpenChange={setKycModalOpen} existingKyc={kycStatus === 'rejected' ? existingKyc : null} onSuccess={() => { onRefresh(); toast({ title: "Submitted", description: "Your KYC was submitted successfully." }); }} />

            <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Connect Your Wallet</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label htmlFor="walletAddress">Ethereum Wallet Address</Label>
                        <Input id="walletAddress" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWalletModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleWalletConnect}>Connect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* UPDATED: PARTIAL SELLING MODAL */}
            <Dialog open={sellModalOpen} onOpenChange={setSellModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                            List on Secondary Market
                        </DialogTitle>
                        <DialogDescription>
                            Set your price and choose how many tokens you'd like to list.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* 1. QUANTITY INPUT */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="tokenAmount">Amount to Sell</Label>
                                <span className="text-xs text-muted-foreground">Owned: {selectedInvestment?.tokens_owned}</span>
                            </div>
                            <Input
                                id="tokenAmount"
                                type="number"
                                placeholder="Quantity"
                                value={tokenAmount}
                                onChange={(e) => setTokenAmount(e.target.value)}
                            />
                        </div>

                        {/* 2. PRICE PER TOKEN INPUT */}
                        <div className="space-y-2">
                            <Label htmlFor="pricePerToken">Asking Price (Per Token)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">PKR</span>
                                <Input
                                    id="pricePerToken"
                                    className="pl-12"
                                    type="number"
                                    placeholder="e.g. 2600"
                                    value={pricePerToken}
                                    onChange={(e) => setPricePerToken(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 3. DURATION SELECT */}
                        <div className="space-y-2">
                            <Label>Listing Expiry</Label>
                            <Select value={daysValid} onValueChange={setDaysValid}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="90">90 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* SUMMARY CARD */}
                        {pricePerToken && tokenAmount && (
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Sale Value:</span>
                                    <span className="font-bold text-primary">
                                        PKR {(parseInt(tokenAmount) * parseFloat(pricePerToken)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSellModalOpen(false)}>Cancel</Button>
                        <Button
                            disabled={isListing || !pricePerToken || !tokenAmount || parseInt(tokenAmount) > selectedInvestment?.tokens_owned}
                            onClick={handleCreateListing}
                        >
                            {isListing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm & List
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}