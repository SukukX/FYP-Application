"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Wallet, Building2, Shield, ArrowRightLeft, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { KYCWizard } from "@/components/KYCWizard";

export default function InvestorPanel({ investorData, commonData, onRefresh }: { investorData: any, commonData: any, onRefresh: () => void }) {
    
    // 1. READ DIRECTLY FROM PROPS
    const stats = investorData?.stats || { totalInvestment: 0, propertiesOwned: 0, totalTokens: 0 };
    const portfolio = investorData?.portfolio || [];
    const investments = investorData?.investments || []; // Array of detailed investments for the list
    
    const kycStatus = commonData?.kycStatus || 'not_submitted';
    const connectedWallet = commonData?.walletAddress || null;

    // 2. INTERACTIVE UI STATES
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    
    // 3. SECONDARY MARKET UI STATES
    const [sellModalOpen, setSellModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
    const [askingPrice, setAskingPrice] = useState("");
    const [isListing, setIsListing] = useState(false);

    const { toast } = useToast();

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
        <div className="space-y-8 animate-fade-in">
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

            <div className="grid md:grid-cols-3 gap-6">
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
            </div>

            {/* Portfolio Distribution */}
            <Card>
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
                                        data={portfolio.length > 0 ? portfolio : [{ name: "No Data", value: 100, color: "#e5e7eb" }]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={portfolio.length > 0 ? (entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%` : undefined}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {portfolio.length > 0 ? portfolio.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        )) : (
                                            <Cell fill="#e5e7eb" />
                                        )}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            {portfolio.length === 0 ? (
                                <>
                                    <p className="text-muted-foreground">
                                        Your portfolio is currently empty. Start investing in tokenized real estate to see your distribution here.
                                    </p>
                                    <Link href="/marketplace">
                                        <Button className="w-full">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            Browse Marketplace
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-muted-foreground">
                                        Your investments are spread across {stats.propertiesOwned} properties. Diversifying your portfolio across different property types reduces risk.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* NEW: Active Investments List & Secondary Market Triggers */}
            {investments && investments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Your Active Investments
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
                                                setAskingPrice(""); // reset input
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
                                    <Button variant="outline" size="sm" onClick={() => setKycModalOpen(true)}>
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
                                    <Shield className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-destructive mb-1">Verification Rejected</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        There was an issue with your submission. Please prevent common errors like blurry images and try again.
                                    </p>
                                    <Button variant="outline" size="sm" className="border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={() => setKycModalOpen(true)}>
                                        Resubmit Documents
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
                                        <Button variant="outline" size="sm" className="border-green-500 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20" disabled>
                                            Active
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDisconnectWallet}>
                                            Disconnect
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setWalletModalOpen(true)}>
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

            {/* KYC Wizard */}
            <KYCWizard
                open={kycModalOpen}
                onOpenChange={setKycModalOpen}
                onSuccess={() => {
                    onRefresh();
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

            {/* NEW: SELL TOKENS MODAL */}
            <Dialog open={sellModalOpen} onOpenChange={setSellModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>List on Secondary Market</DialogTitle>
                        <DialogDescription>
                            Create a P2P listing to sell your tokens. You are creating a fixed bundle of <strong>{selectedInvestment?.tokens_owned} tokens</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="askingPrice">Total Asking Price for Bundle (PKR)</Label>
                            <Input 
                                id="askingPrice" 
                                type="number" 
                                placeholder="e.g. 500000" 
                                value={askingPrice}
                                onChange={(e) => setAskingPrice(e.target.value)}
                            />
                            {askingPrice && selectedInvestment?.tokens_owned > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Implied price per token: PKR {(parseFloat(askingPrice) / selectedInvestment.tokens_owned).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSellModalOpen(false)} disabled={isListing}>
                            Cancel
                        </Button>
                        <Button 
                            disabled={isListing || !askingPrice || parseFloat(askingPrice) <= 0} 
                            onClick={async () => {
                                setIsListing(true);
                                try {
                                    await api.post("/exchange/listings", {
                                        sukuk_id: selectedInvestment.sukuk_id,
                                        token_amount: selectedInvestment.tokens_owned,
                                        total_asking_price: parseFloat(askingPrice)
                                    });
                                    toast({ title: "Success", description: "Tokens listed on the exchange!" });
                                    setSellModalOpen(false);
                                    onRefresh(); 
                                } catch (error: any) {
                                    toast({ 
                                        title: "Error", 
                                        description: error.response?.data?.message || "Failed to list tokens.", 
                                        variant: "destructive" 
                                    });
                                } finally {
                                    setIsListing(false);
                                }
                            }}
                        >
                            {isListing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Listing...</>
                            ) : (
                                "Confirm Listing"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}