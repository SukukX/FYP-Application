"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Shield, MapPin, TrendingUp, TrendingDown, FileText, ExternalLink, Wallet } from "lucide-react";
import { mockListings, storage } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    CartesianGrid
} from "recharts";
import { Chatbot } from "@/components/Chatbot";

export default function PropertyDetail() {
    const { id } = useParams();
    const { toast } = useToast();
    const listing = mockListings.find((l) => l.id === id);
    const [buyModalOpen, setBuyModalOpen] = useState(false);
    const [numTokens, setNumTokens] = useState(1);
    const [loading, setLoading] = useState(false);
    const currentUser = storage.getUser();

    if (!listing) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold text-primary mb-4">Property Not Found</h1>
                    <Link href="/marketplace">
                        <Button>Back to Marketplace</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const totalPrice = numTokens * listing.pricePerToken;
    const estimatedFees = totalPrice * 0.02;

    // Calculate today's metrics
    const currentPrice = listing.pricePerToken;
    const priceHistory = listing.priceHistory || [];
    const todayLow = priceHistory.length > 0
        ? Math.min(...priceHistory.slice(-7).map(p => p.price))
        : currentPrice * 0.95;
    const todayHigh = priceHistory.length > 0
        ? Math.max(...priceHistory.slice(-7).map(p => p.price))
        : currentPrice * 1.05;
    const roi = priceHistory.length > 1
        ? ((currentPrice - priceHistory[0].price) / priceHistory[0].price) * 100
        : 0;

    const handleBuyTokens = async () => {
        if (!currentUser) {
            toast({
                title: "Authentication Required",
                description: "Please log in as an Investor to purchase tokens.",
                variant: "destructive",
            });
            setBuyModalOpen(false);
            return;
        }

        if (currentUser.role !== "investor") {
            toast({
                title: "Access Denied",
                description: "Only Investors can purchase tokens.",
                variant: "destructive",
            });
            setBuyModalOpen(false);
            return;
        }

        if (currentUser.kycStatus !== "verified") {
            toast({
                title: "KYC Verification Required",
                description: "Please complete KYC verification to purchase tokens.",
                variant: "destructive",
            });
            setBuyModalOpen(false);
            return;
        }

        if (numTokens > listing.tokensAvailable) {
            toast({
                title: "Insufficient Tokens",
                description: `Only ${listing.tokensAvailable} tokens available.`,
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        // Simulate blockchain transaction
        setTimeout(() => {
            const portfolio = storage.getPortfolio(currentUser.id);
            const existingHolding = portfolio.find((h: any) => h.listingId === listing.id);

            if (existingHolding) {
                existingHolding.numTokens += numTokens;
                existingHolding.totalValue = existingHolding.numTokens * listing.pricePerToken;
            } else {
                portfolio.push({
                    listingId: listing.id,
                    listingTitle: listing.title,
                    numTokens,
                    pricePerToken: listing.pricePerToken,
                    totalValue: totalPrice,
                    purchaseDate: new Date().toISOString(),
                });
            }

            storage.setPortfolio(currentUser.id, portfolio);

            setLoading(false);
            setBuyModalOpen(false);

            toast({
                title: "Purchase Successful",
                description: `Successfully purchased ${numTokens} tokens for PKR ${totalPrice.toLocaleString()}`,
            });
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6 animate-fade-in">
                        {/* Image Gallery */}
                        <div className="relative h-96 rounded-lg overflow-hidden">
                            <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-4 right-4 bg-verified text-verified-foreground">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        </div>

                        {/* Title & Address */}
                        <div>
                            <h1 className="text-3xl font-bold text-primary mb-2">{listing.title}</h1>
                            <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2" />
                                {listing.address}
                            </div>
                        </div>

                        {/* Price Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Token Price History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={listing.priceHistory}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                            tickLine={{ stroke: 'hsl(var(--border))' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                            tickLine={{ stroke: 'hsl(var(--border))' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            fill="url(#colorPrice)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Legal Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {listing.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span>{doc.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Regulator Comments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Regulator Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{listing.regulatorComments}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Trading Panel */}
                    <div className="space-y-6 animate-slide-up">
                        {/* Price Overview Card */}
                        <Card className="border-2 border-accent/20">
                            <CardHeader>
                                <CardTitle>Current Price</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-primary">
                                        PKR {(currentPrice / 1000).toFixed(0)}K
                                    </span>
                                    <Badge variant={roi >= 0 ? "default" : "destructive"} className="ml-2">
                                        {roi >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                        {roi.toFixed(2)}%
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Today's Low</p>
                                        <p className="text-lg font-semibold text-destructive">PKR {(todayLow / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Today's High</p>
                                        <p className="text-lg font-semibold text-verified">PKR {(todayHigh / 1000).toFixed(0)}K</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Token Information Card */}
                        <Card className="border-2 border-accent/20">
                            <CardHeader>
                                <CardTitle>Token Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valuation</span>
                                    <span className="font-semibold text-primary">PKR {(listing.valuation / 1000000).toFixed(1)}M</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Tokens</span>
                                    <span className="font-semibold">{listing.totalTokens}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Available</span>
                                    <span className="font-semibold flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3 text-verified" />
                                        {listing.tokensAvailable}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">For Sale</span>
                                    <span className="font-semibold">{listing.tokensForSale} ({((listing.tokensForSale / listing.totalTokens) * 100).toFixed(0)}%)</span>
                                </div>

                                <div className="pt-4 border-t space-y-2">
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={() => {
                                            if (!currentUser) {
                                                toast({
                                                    title: "Login Required",
                                                    description: "Please log in to purchase tokens.",
                                                    variant: "destructive",
                                                    action: (
                                                        <Link href="/auth/login">
                                                            <Button variant="outline" size="sm">Login</Button>
                                                        </Link>
                                                    )
                                                });
                                                return;
                                            }
                                            setBuyModalOpen(true);
                                        }}
                                    >
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Buy Tokens
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                        onClick={() => {
                                            if (!currentUser) {
                                                toast({
                                                    title: "Login Required",
                                                    description: "Please log in to sell tokens.",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                    >
                                        Sell Tokens
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Buy Modal */}
            <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Purchase Tokens</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Number of Tokens</label>
                            <Input
                                type="number"
                                min={1}
                                max={listing.tokensAvailable}
                                value={numTokens}
                                onChange={(e) => setNumTokens(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        <div className="space-y-2 p-4 bg-accent/10 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Price per Token</span>
                                <span>PKR {listing.pricePerToken.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tokens</span>
                                <span>{numTokens}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>PKR {totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Est. Fees (2%)</span>
                                <span>PKR {estimatedFees.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-primary">PKR {(totalPrice + estimatedFees).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBuyModalOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleBuyTokens} disabled={loading}>
                            {loading ? "Processing..." : "Confirm Purchase"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Chatbot />
        </div>
    );
}
