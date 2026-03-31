"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp, TrendingDown, Wallet, DollarSign, Building2,
    LayoutGrid, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
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

interface Stats {
    totalInvestment: number;
    totalTokens: number;
    propertiesOwned: number;
}

export default function InvestorPortfolio() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [stats, setStats] = useState<Stats>({ totalInvestment: 0, totalTokens: 0, propertiesOwned: 0 });
    const [portfolioChart, setPortfolioChart] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { toast } = useToast();

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const res = await api.get("/dashboard/investor");
            setHoldings(res.data.holdings || []);
            setStats(res.data.stats || { totalInvestment: 0, totalTokens: 0, propertiesOwned: 0 });
            setPortfolioChart(res.data.portfolio || []);
        } catch (e: any) {
            toast({ title: "Error", description: "Could not load portfolio data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Build per-property pie chart from holdings
    const allocationData = holdings.map((h, i) => ({
        name: h.property_title.length > 22 ? h.property_title.substring(0, 22) + "…" : h.property_title,
        value: h.current_value,
        color: COLORS[i % COLORS.length],
    }));

    const totalPnL = holdings.reduce((s, h) => s + h.profit_loss, 0);
    const totalPurchase = holdings.reduce((s, h) => s + h.purchase_value, 0);
    const overallPnLPct = totalPurchase > 0 ? (totalPnL / totalPurchase) * 100 : 0;
    const isGain = totalPnL >= 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
                        </div>
                        <Skeleton className="h-80 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-4xl font-bold text-primary mb-1">My Portfolio</h1>
                        <p className="text-muted-foreground">Track your tokenized real estate investments</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchData(true)} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="animate-slide-up">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">PKR {stats.totalInvestment.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across {stats.propertiesOwned} properties</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "80ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Security tokens owned</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "160ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealised P&amp;L</CardTitle>
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

                    <Card className="animate-slide-up" style={{ animationDelay: "240ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.propertiesOwned}</div>
                            <p className="text-xs text-muted-foreground mt-1">Unique assets in portfolio</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Holdings List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5" />
                            My Holdings
                            <Badge variant="secondary" className="ml-2">{holdings.length}</Badge>
                        </h2>

                        {holdings.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                                    <h3 className="text-lg font-semibold text-primary mb-2">No Holdings Yet</h3>
                                    <p className="text-muted-foreground mb-6">
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
                                                            <p className="text-xs text-muted-foreground">P&amp;L</p>
                                                            <p className={`font-semibold text-sm flex items-center gap-0.5 ${gain ? "text-verified" : "text-destructive"}`}>
                                                                {gain
                                                                    ? <ArrowUpRight className="h-3 w-3" />
                                                                    : <ArrowDownRight className="h-3 w-3" />
                                                                }
                                                                {gain ? "+" : ""}{holding.profit_loss_pct.toFixed(2)}%
                                                            </p>
                                                            <p className={`text-xs ${gain ? "text-verified/80" : "text-destructive/80"}`}>
                                                                {gain ? "+" : ""}PKR {Math.abs(holding.profit_loss).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Purchase date footer */}
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

                    {/* Right Column: Charts */}
                    <div className="space-y-6">
                        {/* Allocation Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Portfolio Allocation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {allocationData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={allocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {allocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Value"]}
                                            />
                                            <Legend
                                                formatter={(value) => <span className="text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-muted-foreground py-12 text-sm">No holdings to display</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Type Breakdown */}
                        {portfolioChart.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">By Property Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {portfolioChart.map((segment, i) => {
                                            const pct = stats.totalInvestment > 0
                                                ? (segment.value / stats.totalInvestment) * 100
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

                        {/* Quick Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/marketplace" className="block">
                                    <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                        <Building2 className="h-4 w-4" />
                                        Browse Marketplace
                                    </Button>
                                </Link>
                                <Link href="/dashboard/investor" className="block">
                                    <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                                        <TrendingUp className="h-4 w-4" />
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
