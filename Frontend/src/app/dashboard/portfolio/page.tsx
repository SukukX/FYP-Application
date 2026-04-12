"use client";

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp, TrendingDown, Wallet, DollarSign, Building2,
    LayoutGrid, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw,
    BarChart3, Layers, ChevronRight, Users, Star
} from "lucide-react";
import Link from "next/link";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend,
    Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from "recharts";
import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--verified))",
    "#d4af37",
    "#6366f1",
    "#ec4899",
];

interface Holding {
    investment_id: number;
    property_id: number;
    property_title: string;
    property_location: string;
    property_type: string;
    property_image: string | null;
    sukuk_id: number;
    tokens_owned: number;
    price_per_token: number;
    purchase_value: number;
    current_value: number;
    profit_loss: number;
    profit_loss_pct: number;
    purchase_date: string;
}

interface OwnerListing {
    property_id: number;
    title: string;
    location: string;
    property_type: string;
    valuation: number;
    total_tokens: number;
    tokens_available: number;
    tokens_sold: number;
    token_price: number;
    verification_status: string;
    listing_status: string;
    documents: any[];
}

export default function UnifiedPortfolio() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [listings, setListings] = useState<OwnerListing[]>([]);
    const [investorStats, setInvestorStats] = useState({ totalInvestment: 0, totalTokens: 0, propertiesOwned: 0 });
    const [ownerStats, setOwnerStats] = useState({ activeListings: 0, tokensSold: 0, totalRevenue: 0 });
    const [walletBalance, setWalletBalance] = useState(0);
    const [portfolioChart, setPortfolioChart] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'investments' | 'properties'>('investments');
    const { toast } = useToast();

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const res = await api.get("/dashboard/user");
            setHoldings(res.data.investorData?.holdings || []);
            setInvestorStats(res.data.investorData?.stats || { totalInvestment: 0, totalTokens: 0, propertiesOwned: 0 });
            setPortfolioChart(res.data.investorData?.portfolio || []);
            setListings(res.data.ownerData?.listings || []);
            setOwnerStats(res.data.ownerData?.stats || { activeListings: 0, tokensSold: 0, totalRevenue: 0 });
            setWalletBalance(res.data.common?.walletBalance || 0);
        } catch {
            toast({ title: "Error", description: "Could not load portfolio data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Investor calculations ---
    const allocationData = holdings.map((h, i) => ({
        name: h.property_title.length > 22 ? h.property_title.substring(0, 22) + "…" : h.property_title,
        value: h.current_value,
        color: COLORS[i % COLORS.length],
    }));
    const totalPnL = holdings.reduce((s, h) => s + h.profit_loss, 0);
    const totalPurchase = holdings.reduce((s, h) => s + h.purchase_value, 0);
    const overallPnLPct = totalPurchase > 0 ? (totalPnL / totalPurchase) * 100 : 0;
    const isGain = totalPnL >= 0;

    // --- Owner revenue bar chart data ---
    const revenueData = useMemo(() =>
        listings
            .filter(l => l.tokens_sold > 0)
            .map(l => ({
                name: l.title.length > 18 ? l.title.substring(0, 18) + "…" : l.title,
                revenue: l.tokens_sold * Number(l.token_price),
                tokens: l.tokens_sold,
            })), [listings]
    );

    const totalCombinedValue = investorStats.totalInvestment + ownerStats.totalRevenue;

    // --- Loading skeleton ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-72 rounded-xl" />
                            <Skeleton className="h-48 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-16">
            <Navbar />

            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* ───── HEADER ───── */}
                <div className="flex items-start justify-between animate-fade-in">
                    <div>
                        <h1 className="text-4xl font-bold text-primary mb-1">My Portfolio</h1>
                        <p className="text-muted-foreground">Combined overview of your investments and property listings</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                                Dashboard <ChevronRight className="h-3 w-3" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchData(true)} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* ───── UNIFIED STAT CARDS ───── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Wallet Balance */}
                    <Card className="animate-slide-up col-span-2 lg:col-span-1 bg-gradient-to-br from-verified/10 to-transparent border-verified/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
                            <Wallet className="h-4 w-4 text-verified" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-verified">PKR {walletBalance.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Available Funds</p>
                        </CardContent>
                    </Card>

                    {/* Combined Net Worth */}
                    <Card className="animate-slide-up col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20" style={{ animationDelay: "60ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Worth</CardTitle>
                            <Star className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">PKR {totalCombinedValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Investments + Revenue earned</p>
                        </CardContent>
                    </Card>

                    {/* Investor Stats */}
                    <Card className="animate-slide-up" style={{ animationDelay: "120ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">PKR {investorStats.totalInvestment.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">{investorStats.propertiesOwned} properties invested</p>
                        </CardContent>
                    </Card>

                    {/* P&L */}
                    <Card className="animate-slide-up" style={{ animationDelay: "180ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealised P&L</CardTitle>
                            {isGain
                                ? <TrendingUp className="h-4 w-4 text-verified" />
                                : <TrendingDown className="h-4 w-4 text-destructive" />
                            }
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isGain ? "text-verified" : "text-destructive"}`}>
                                {isGain ? "+" : ""}PKR {Math.abs(totalPnL).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isGain ? "+" : ""}{overallPnLPct.toFixed(2)}% all-time
                            </p>
                        </CardContent>
                    </Card>

                    {/* Owner Stats */}
                    <Card className="animate-slide-up" style={{ animationDelay: "240ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Property Revenue</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">PKR {ownerStats.totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">{ownerStats.tokensSold} tokens sold • {ownerStats.activeListings} active</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ───── TAB SWITCHER ───── */}
                <div className="flex gap-1 p-1 bg-muted/50 border border-border/50 rounded-lg w-fit shadow-sm">
                    <Button
                        variant={activeTab === 'investments' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('investments')}
                        className="rounded-md transition-all gap-2"
                    >
                        <Wallet className="w-4 h-4" />
                        Investment Holdings
                        {holdings.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{holdings.length}</Badge>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'properties' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('properties')}
                        className="rounded-md transition-all gap-2"
                    >
                        <Building2 className="w-4 h-4" />
                        My Properties
                        {listings.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{listings.length}</Badge>
                        )}
                    </Button>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/*  INVESTMENT HOLDINGS TAB                        */}
                {/* ═══════════════════════════════════════════════ */}
                {activeTab === 'investments' && (
                    <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Holdings List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5" />
                                My Holdings
                                <Badge variant="secondary" className="ml-1">{holdings.length}</Badge>
                            </h2>

                            {holdings.length === 0 ? (
                                <Card>
                                    <CardContent className="py-16 text-center">
                                        <Wallet className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                                        <h3 className="text-lg font-semibold text-primary mb-2">No Investment Holdings</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Browse the marketplace to start investing in tokenized real estate.
                                        </p>
                                        <Link href="/marketplace">
                                            <Button>Browse Marketplace</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                holdings.map((holding, idx) => {
                                    const gain = holding.profit_loss >= 0;
                                    return (
                                        <Card
                                            key={holding.investment_id}
                                            className="group overflow-hidden hover:shadow-lg hover:border-accent/50 transition-all duration-300 animate-slide-up"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            <CardContent className="p-0">
                                                <div className="flex">
                                                    {/* Property Image */}
                                                    <div className="w-32 flex-shrink-0 bg-muted relative overflow-hidden">
                                                        {holding.property_image ? (
                                                            <img
                                                                src={getFileUrl(holding.property_image)}
                                                                alt={holding.property_title}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Building2 className="h-8 w-8 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-5">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h3 className="font-semibold text-primary text-base leading-tight mb-1">
                                                                    {holding.property_title}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground">{holding.property_location}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <Badge variant="outline" className="capitalize text-xs">
                                                                    {holding.property_type}
                                                                </Badge>
                                                                <Link href={`/marketplace/${holding.property_id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                                                        View <ArrowUpRight className="h-3 w-3" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Tokens</p>
                                                                <p className="font-semibold text-sm">{holding.tokens_owned.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Price/Token</p>
                                                                <p className="font-semibold text-sm">PKR {holding.price_per_token.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Current Value</p>
                                                                <p className="font-semibold text-sm text-primary">PKR {holding.current_value.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">P&L</p>
                                                                <p className={`font-semibold text-sm flex items-center gap-0.5 ${gain ? "text-verified" : "text-destructive"}`}>
                                                                    {gain ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                                    {gain ? "+" : ""}{holding.profit_loss_pct.toFixed(2)}%
                                                                </p>
                                                                <p className={`text-xs ${gain ? "text-verified/80" : "text-destructive/80"}`}>
                                                                    {gain ? "+" : ""}PKR {Math.abs(holding.profit_loss).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            Purchased {new Date(holding.purchase_date).toLocaleDateString("en-PK", {
                                                                day: "numeric", month: "short", year: "numeric"
                                                            })}
                                                            <span className="mx-1">·</span>
                                                            Cost basis: PKR {holding.purchase_value.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        {/* Right: Charts */}
                        <div className="space-y-4">
                            {/* Allocation Pie */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Layers className="h-4 w-4" /> Portfolio Allocation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {allocationData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={allocationData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={85}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {allocationData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <ReTooltip
                                                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Value"]}
                                                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                                                />
                                                <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-10 text-sm">No holdings to display</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* By Property Type */}
                            {portfolioChart.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4" /> By Property Type
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioChart.map((segment, i) => {
                                                const pct = investorStats.totalInvestment > 0
                                                    ? (segment.value / investorStats.totalInvestment) * 100
                                                    : 0;
                                                return (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium">{segment.name}</span>
                                                            <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${pct}%`, backgroundColor: segment.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Link href="/marketplace" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                            <Building2 className="h-4 w-4" /> Browse Marketplace
                                        </Button>
                                    </Link>
                                    <Link href="/exchange" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                            <ArrowUpRight className="h-4 w-4" /> Secondary Exchange
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                            <TrendingUp className="h-4 w-4" /> Back to Dashboard
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/*  MY PROPERTIES TAB (Owner View)                 */}
                {/* ═══════════════════════════════════════════════ */}
                {activeTab === 'properties' && (
                    <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Property Listings */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                My Property Listings
                                <Badge variant="secondary" className="ml-1">{listings.length}</Badge>
                            </h2>

                            {listings.length === 0 ? (
                                <Card>
                                    <CardContent className="py-16 text-center">
                                        <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                                        <h3 className="text-lg font-semibold text-primary mb-2">No Properties Listed</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            List a property to tokenize it and start earning from token sales.
                                        </p>
                                        <Link href="/dashboard">
                                            <Button>Go to Dashboard</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                listings.map((listing, idx) => {
                                    const totalTokens = listing.total_tokens || 1;
                                    const soldPct = ((listing.tokens_sold || 0) / totalTokens) * 100;
                                    const availPct = ((listing.tokens_available || 0) / totalTokens) * 100;
                                    const reservedPct = Math.max(0, 100 - soldPct - availPct);
                                    const revenue = (listing.tokens_sold || 0) * Number(listing.token_price);
                                    const imageDoc = listing.documents?.find((d: any) => d.file_type?.startsWith('image/'));
                                    return (
                                        <Card
                                            key={listing.property_id}
                                            className="group overflow-hidden hover:shadow-lg hover:border-accent/50 transition-all duration-300 animate-slide-up"
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                        >
                                            <CardContent className="p-0">
                                                <div className="flex">
                                                    {/* Image */}
                                                    <div className="w-32 flex-shrink-0 bg-muted relative overflow-hidden">
                                                        {imageDoc ? (
                                                            <img
                                                                src={getFileUrl(imageDoc.file_path)}
                                                                alt={listing.title}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Building2 className="h-8 w-8 text-muted-foreground/40" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 left-2">
                                                            <Badge
                                                                className="text-[10px] px-1.5"
                                                                variant={
                                                                    listing.verification_status === 'approved' ? 'default' :
                                                                    listing.verification_status === 'rejected' ? 'destructive' : 'secondary'
                                                                }
                                                            >
                                                                {listing.verification_status}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-5">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h3 className="font-semibold text-primary text-base leading-tight mb-1">{listing.title}</h3>
                                                                <p className="text-xs text-muted-foreground">{listing.location}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <Badge variant="outline" className="capitalize text-xs">{listing.property_type}</Badge>
                                                                {listing.verification_status === 'approved' && (
                                                                    <Link href={`/marketplace/${listing.property_id}`}>
                                                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                                                            View <ArrowUpRight className="h-3 w-3" />
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Valuation</p>
                                                                <p className="font-semibold text-sm">PKR {Number(listing.valuation).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Tokens Sold</p>
                                                                <p className="font-semibold text-sm text-verified">{(listing.tokens_sold || 0).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Available</p>
                                                                <p className="font-semibold text-sm text-accent">{(listing.tokens_available || 0).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Revenue</p>
                                                                <p className="font-semibold text-sm text-primary">PKR {revenue.toLocaleString()}</p>
                                                            </div>
                                                        </div>

                                                        {/* Token Distribution Bar */}
                                                        <div>
                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Token Distribution</span>
                                                                <span>{listing.total_tokens.toLocaleString()} total</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-muted/50 rounded-full flex overflow-hidden border border-border/50">
                                                                <div className="bg-verified h-full transition-all duration-700" style={{ width: `${soldPct}%` }} title={`${listing.tokens_sold} Sold`} />
                                                                <div className="bg-accent h-full transition-all duration-700" style={{ width: `${availPct}%` }} title={`${listing.tokens_available} Available`} />
                                                                <div className="bg-muted-foreground/20 h-full transition-all duration-700" style={{ width: `${reservedPct}%` }} title="Reserved" />
                                                            </div>
                                                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-verified inline-block" /> {listing.tokens_sold || 0} Sold</span>
                                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> {listing.tokens_available || 0} Avail</span>
                                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" /> Reserved</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        {/* Right: Owner Charts */}
                        <div className="space-y-4">
                            {/* Revenue Bar Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> Revenue by Property
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {revenueData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={revenueData} margin={{ left: 0, right: 0, top: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <ReTooltip
                                                    formatter={(val: number) => [`PKR ${val.toLocaleString()}`, "Revenue"]}
                                                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                                                />
                                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-10 text-sm">No token sales yet</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Owner Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Listing Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        { label: "Total Listings", value: listings.length },
                                        { label: "Active", value: listings.filter(l => l.listing_status === 'active').length, color: "text-verified" },
                                        { label: "Pending Approval", value: listings.filter(l => l.verification_status === 'pending').length, color: "text-orange-500" },
                                        { label: "Rejected", value: listings.filter(l => l.verification_status === 'rejected').length, color: "text-destructive" },
                                        { label: "Drafts", value: listings.filter(l => l.verification_status === 'draft').length, color: "text-muted-foreground" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className={`font-semibold ${color || ""}`}>{value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Link href="/dashboard" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                            <Building2 className="h-4 w-4" /> Manage Listings
                                        </Button>
                                    </Link>
                                    <Link href="/marketplace" className="block">
                                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                            <TrendingUp className="h-4 w-4" /> Browse Marketplace
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
