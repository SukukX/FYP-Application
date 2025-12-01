"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Wallet, Building2, Shield } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function InvestorDashboard() {
    const { user: currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalInvestment: 0,
        propertiesOwned: 0,
        totalTokens: 0
    });
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [kycData, setKycData] = useState({ fullName: "", cnic: "", cnicExpiry: "" });
    const [walletAddress, setWalletAddress] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/dashboard/investor");
            setStats(res.data.stats);
            setPortfolio(res.data.portfolio);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const portfolioData = [
        { name: "Residential", value: 40, color: "hsl(var(--primary))" },
        { name: "Commercial", value: 35, color: "hsl(var(--accent))" },
        { name: "Industrial", value: 25, color: "hsl(var(--verified))" },
    ];

    const handleKycSubmit = async () => {
        if (!kycData.fullName || !kycData.cnic || !kycData.cnicExpiry) {
            toast({
                title: "Incomplete Form",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            await api.post("/kyc/submit", kycData);
            toast({
                title: "KYC Submitted",
                description: "Your KYC application has been submitted for verification.",
            });
            setKycModalOpen(false);
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Failed to submit KYC",
                variant: "destructive",
            });
        }
    };

    const handleWalletConnect = () => {
        if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            toast({
                title: "Invalid Address",
                description: "Please enter a valid Ethereum wallet address.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Wallet Connected",
            description: "Your wallet has been successfully connected.",
        });
        setWalletModalOpen(false);
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
                        <Badge className={`${currentUser?.kycStatus === 'verified' ? 'bg-verified' : 'bg-pending'} text-primary-foreground`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {currentUser?.kycStatus === 'verified' ? 'KYC Verified' : 'KYC Pending'}
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

                {/* Portfolio Distribution */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Portfolio Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-full md:w-1/2 h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={portfolioData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {portfolioData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 space-y-4">
                                <p className="text-muted-foreground">
                                    Your portfolio is currently empty. Start investing in tokenized real estate to see your distribution here.
                                </p>
                                <Link href="/marketplace">
                                    <Button className="w-full">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        Browse Marketplace
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Getting Started
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
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

                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Wallet className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Connect Your Wallet</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Link your Ethereum wallet to receive and manage security tokens.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setWalletModalOpen(true)}
                                    >
                                        Connect Wallet
                                    </Button>
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

            {/* KYC Modal */}
            <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Complete KYC Verification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={kycData.fullName}
                                onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                                placeholder="Enter your legal full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnic">CNIC Number</Label>
                            <Input
                                id="cnic"
                                value={kycData.cnic}
                                onChange={(e) => setKycData({ ...kycData, cnic: e.target.value })}
                                placeholder="42101-1234567-1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnicExpiry">CNIC Expiry Date</Label>
                            <Input
                                id="cnicExpiry"
                                type="date"
                                value={kycData.cnicExpiry}
                                onChange={(e) => setKycData({ ...kycData, cnicExpiry: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Upload Documents</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" className="w-full">
                                    CNIC Front
                                </Button>
                                <Button variant="outline" className="w-full">
                                    CNIC Back
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setKycModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleKycSubmit}>
                            Submit for Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
