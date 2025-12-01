"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, DollarSign } from "lucide-react";
import { storage, mockListings } from "@/lib/mockData";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/auth-context";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--verified))", "#d4af37"];

export default function InvestorPortfolio() {
    const { user: currentUser } = useAuth();
    const [portfolio, setPortfolio] = useState<any[]>([]);

    useEffect(() => {
        if (currentUser) {
            setPortfolio(storage.getPortfolio(currentUser.user_id.toString()));
        }
    }, [currentUser]);

    const totalValue = portfolio.reduce((sum: number, h: any) => sum + h.totalValue, 0);
    const totalTokens = portfolio.reduce((sum: number, h: any) => sum + h.numTokens, 0);

    const chartData = portfolio.map((holding: any) => ({
        name: holding.listingTitle.substring(0, 20) + "...",
        value: holding.totalValue,
    }));

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">My Portfolio</h1>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="animate-slide-up">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">PKR {totalValue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Across {portfolio.length} properties</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTokens}</div>
                            <p className="text-xs text-muted-foreground">Security tokens owned</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Growth</CardTitle>
                            <TrendingUp className="h-4 w-4 text-verified" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-verified">+3.2%</div>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Holdings List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold mb-4">My Holdings</h2>

                        {portfolio.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground mb-4">You don't own any tokens yet.</p>
                                    <Link href="/marketplace">
                                        <Button>Browse Marketplace</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            portfolio.map((holding: any, idx: number) => {
                                const listing = mockListings.find((l) => l.id === holding.listingId);
                                return (
                                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg mb-1">{holding.listingTitle}</h3>
                                                    <Badge variant="outline">Verified</Badge>
                                                </div>
                                                <Link href={`/marketplace/${holding.listingId}`}>
                                                    <Button variant="outline" size="sm">View</Button>
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Tokens Owned</p>
                                                    <p className="font-semibold">{holding.numTokens}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Price/Token</p>
                                                    <p className="font-semibold">PKR {holding.pricePerToken.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Value</p>
                                                    <p className="font-semibold text-primary">PKR {holding.totalValue.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>

                    {/* Allocation Chart */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Portfolio Allocation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {chartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-muted-foreground py-12">No holdings to display</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
