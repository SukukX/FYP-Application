"use client";
/**
 * [PAGE] Owner Dashboard
 * ----------------------
 * Purpose: Main hub for Property Owners to manage their portfolio.
 * Features:
 * - View Stats (Active Listings, Tokens Sold, Revenue).
 * - Create New Listings (Multi-step wizard).
 * - Manage Token Supply (Minting/Burning simulation).
 * - "Go Live" control (requires Regulator Approval).
 * 
 * Connection: Fetches data from GET /api/dashboard/owner
 */

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Building2, SlidersHorizontal, Shield, Clock, Lock, CheckCircle, ArrowRight, ArrowLeft, AlertCircle, FileText, ExternalLink, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";
import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";
import { KYCWizard } from "@/components/KYCWizard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function OwnerDashboard() {
    const [listingModalOpen, setListingModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [stats, setStats] = useState({
        activeListings: 0,
        tokensSold: 0,
        totalRevenue: 0
    });
    const [kycStatus, setKycStatus] = useState("not_submitted");
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [selectedRejection, setSelectedRejection] = useState<any>(null);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
    const router = useRouter();

    const [listingData, setListingData] = useState({
        title: "",
        address: "",
        propertyType: "residential",
        description: "",
        valuation: "",
        totalTokens: "",
        tokensForSale: "",
        pricePerToken: "",
    });
    const [files, setFiles] = useState<{ images: File[], docs: File[] }>({
        images: [],
        docs: []
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    /**
     * [DATA FLOW] Fetch Dashboard Data
     * Source: Backend API (GET /api/dashboard/owner)
     * State Updates: Updates stats, listings list, KYC status, and MFA status.
     * Trigger: Runs on component mount (useEffect).
     */
    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/dashboard/owner");
            setListings(res.data.listings);
            setStats(res.data.stats);
            setKycStatus(res.data.kycStatus);
            setMfaEnabled(res.data.mfaEnabled);
            if (res.data.walletAddress) {
                setConnectedWallet(res.data.walletAddress);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!listingData.title || !listingData.address || !listingData.valuation) {
                toast({
                    title: "Incomplete Information",
                    description: "Please fill in all property details.",
                    variant: "destructive",
                });
                return;
            }
        } else if (currentStep === 2) {
            if (!listingData.totalTokens || !listingData.tokensForSale || !listingData.pricePerToken) {
                toast({
                    title: "Incomplete Information",
                    description: "Please fill in all token economics.",
                    variant: "destructive",
                });
                return;
            }
            if (parseInt(listingData.tokensForSale) > parseInt(listingData.totalTokens)) {
                toast({
                    title: "Invalid Input",
                    description: "Tokens for sale cannot exceed total tokens.",
                    variant: "destructive",
                });
                return;
            }
        }
        setCurrentStep(currentStep + 1);
    };

    const handleSaveDraft = () => {
        if (!listingData.title) {
            toast({
                title: "Title Required",
                description: "Please enter a property title to save as draft.",
                variant: "destructive",
            });
            return;
        }
        handleSubmitListing(true);
    };

    /**
     * [ACTION] Submit Listing
     * Logic:
     * - Collects Multi-step form data.
     * - Appends Files (Images/Docs) via FormData.
     * - Handles both 'Draft' (save for later) and 'Submit' (send to regulator).
     * Endpoint: POST /api/properties
     */
    const handleSubmitListing = async (isDraft = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", listingData.title);
            formData.append("location", listingData.address);
            formData.append("description", listingData.description);
            formData.append("property_type", listingData.propertyType);
            formData.append("valuation", listingData.valuation);
            formData.append("total_tokens", listingData.totalTokens);
            formData.append("price_per_token", listingData.pricePerToken);
            formData.append("isDraft", isDraft.toString());
            formData.append("tokens_for_sale", listingData.tokensForSale);

            // Append files
            files.images.forEach((file) => {
                formData.append("images", file);
            });
            files.docs.forEach((file) => {
                formData.append("documents", file);
            });

            await api.post("/properties", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({
                title: isDraft ? "Draft Saved" : "Listing Submitted",
                description: isDraft
                    ? "Your listing has been saved as a draft."
                    : "Your property listing has been submitted for regulator verification.",
            });

            setListingModalOpen(false);
            setCurrentStep(1);
            setListingData({
                title: "",
                address: "",
                propertyType: "residential",
                description: "",
                valuation: "",
                totalTokens: "",
                tokensForSale: "",
                pricePerToken: "",
            });
            setFiles({ images: [], docs: [] });
            fetchDashboardData(); // Refresh data
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Failed to submit listing",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSupply = async (propertyId: number, currentSupply: number, totalTokens: number) => {
        const newSupply = prompt(`Enter new available tokens (Max: ${totalTokens})`, currentSupply.toString());
        if (newSupply === null) return;

        const supply = parseInt(newSupply);
        if (isNaN(supply) || supply < 0 || supply > totalTokens) {
            toast({ title: "Invalid Input", description: "Please enter a valid number within range.", variant: "destructive" });
            return;
        }

        try {
            await api.patch(`/properties/${propertyId}/supply`, { available_tokens: supply });
            toast({ title: "Success", description: "Token supply updated." });
            fetchDashboardData();
        } catch (e: any) {
            toast({ title: "Error", description: e.response?.data?.message || "Failed to update supply", variant: "destructive" });
        }
    };




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
                            <h1 className="text-4xl font-bold text-primary mb-2">Owner Dashboard</h1>
                            <p className="text-muted-foreground">Manage your property listings and tokenization</p>
                        </div>
                        <Badge className="bg-pending text-primary">
                            <Shield className="h-3 w-3 mr-1" />
                            KYC Pending
                        </Badge>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="animate-slide-up">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.activeListings}</div>
                            <p className="text-xs text-muted-foreground mt-1">Properties listed</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Sold</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.tokensSold}</div>
                            <p className="text-xs text-muted-foreground mt-1">From all listings</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">PKR {stats.totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">+12% this month</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Your Listings
                            </CardTitle>
                            <Button onClick={() => setListingModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Listing
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {listings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">You haven't listed any properties yet.</p>
                                <Button size="lg" onClick={() => setListingModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Listing
                                </Button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {listings.map((listing) => (
                                    <Card key={listing.property_id} className="group overflow-hidden border hover:border-accent/50 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row h-full">
                                            {/* Image Section */}
                                            <div className="w-full md:w-48 h-48 md:h-auto relative bg-muted flex-shrink-0">
                                                {listing.documents?.find((d: any) => d.file_type.startsWith('image/')) ? (
                                                    <img
                                                        src={getFileUrl(listing.documents.find((d: any) => d.file_type.startsWith('image/')).file_path)}
                                                        alt={listing.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                                                        <Building2 className="h-8 w-8 mb-2 opacity-50" />
                                                        <span className="text-xs">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2">
                                                    <Badge variant={listing.verification_status === 'approved' ? 'default' : listing.verification_status === 'rejected' ? 'destructive' : 'secondary'} className="shadow-sm">
                                                        {listing.verification_status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <CardContent className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-lg text-primary line-clamp-1">{listing.title}</h3>
                                                                {listing.listing_status === 'active' && <Badge variant="outline" className="text-xs border-success text-success">Live</Badge>}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">{listing.location}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-primary">{parseFloat(listing.valuation).toLocaleString()} PKR</p>
                                                            <p className="text-xs text-muted-foreground">Valuation</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar & Stats */}
                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex justify-between text-sm items-end">
                                                            <span className="text-muted-foreground font-medium">Token Distribution</span>
                                                            {listing.listing_status === 'active' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                                                    onClick={() => handleUpdateSupply(listing.property_id, listing.tokens_available, listing.total_tokens)}
                                                                >
                                                                    Manage Supply
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="w-full bg-muted/50 rounded-full h-2.5 flex overflow-hidden border border-border/50">
                                                            {/* Sold Tokens - Primary Blue (Solid/Done) */}
                                                            <div
                                                                className="bg-primary h-full transition-all duration-500"
                                                                style={{ width: `${((listing.tokens_sold || 0) / listing.total_tokens) * 100}%` }}
                                                                title={`${listing.tokens_sold || 0} Sold`}
                                                            />
                                                            {/* Available Tokens - Accent Gold (Opportunity) */}
                                                            <div
                                                                className="bg-accent h-full transition-all duration-500"
                                                                style={{ width: `${((listing.tokens_available || 0) / listing.total_tokens) * 100}%` }}
                                                                title={`${listing.tokens_available || 0} Available`}
                                                            />
                                                            {/* Reserved - Slate (Inactive) */}
                                                            <div
                                                                className="bg-slate-300 dark:bg-slate-700 h-full transition-all duration-500"
                                                                style={{ width: `${((listing.total_tokens - (listing.tokens_available || 0) - (listing.tokens_sold || 0)) / listing.total_tokens) * 100}%` }}
                                                                title="Reserved"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> {listing.tokens_sold || 0} Sold</span>
                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> {listing.tokens_available || 0} Avail</span>
                                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" /> {listing.total_tokens - (listing.tokens_available || 0) - (listing.tokens_sold || 0)} Rsrv</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 flex-wrap items-center mt-4 pt-4 border-t border-border/50">
                                                    {listing.verification_status === 'draft' && (
                                                        <Button className="flex-1" size="sm" onClick={() => {
                                                            setListingData({
                                                                title: listing.title,
                                                                address: listing.location,
                                                                propertyType: listing.property_type,
                                                                description: listing.description || "",
                                                                valuation: listing.valuation.toString(),
                                                                totalTokens: listing.sukuks?.[0]?.total_tokens?.toString() || "",
                                                                tokensForSale: listing.sukuks?.[0]?.available_tokens?.toString() || "",
                                                                pricePerToken: listing.sukuks?.[0]?.token_price?.toString() || "",
                                                            });
                                                            setListingModalOpen(true);
                                                        }}>
                                                            Complete Listing
                                                        </Button>
                                                    )}

                                                    {listing.verification_status === 'pending' && (
                                                        <Button variant="secondary" className="w-full opacity-70" size="sm" disabled>
                                                            <Clock className="w-3 h-3 mr-2" /> Waiting for Approval
                                                        </Button>
                                                    )}

                                                    {listing.verification_status === 'approved' && listing.listing_status !== 'active' && (
                                                        <Button className="flex-1" size="sm" onClick={async () => {
                                                            try {
                                                                await api.patch(`/properties/${listing.property_id}/status`, { status: "active" });
                                                                toast({ title: "Success", description: "Property is now live!" });
                                                                fetchDashboardData();
                                                            } catch (e) {
                                                                toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                                                            }
                                                        }}>
                                                            Make Live
                                                        </Button>
                                                    )}

                                                    {(listing.listing_status === 'active' || listing.verification_status === 'rejected') && (
                                                        <>
                                                            <Link href={`/marketplace/${listing.property_id}`} className="flex-1">
                                                                <Button variant="outline" size="sm" className="w-full">
                                                                    {listing.listing_status === 'active' ? 'View Listing' : 'View Details'}
                                                                </Button>
                                                            </Link>
                                                            {listing.listing_status === 'active' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                                                                    onClick={async () => {
                                                                        if (confirm("Are you sure you want to unlive this listing?")) {
                                                                            try {
                                                                                await api.patch(`/properties/${listing.property_id}/status`, { status: "hidden" });
                                                                                toast({ title: "Success", description: "Listing is now hidden." });
                                                                                fetchDashboardData();
                                                                            } catch (e: any) {
                                                                                toast({
                                                                                    title: "Action Failed",
                                                                                    description: e.response?.data?.message || "Failed to unlive listing",
                                                                                    variant: "destructive"
                                                                                });
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    Unlive
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}

                                                    {listing.verification_status === "rejected" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                setSelectedRejection({
                                                                    reason: listing.verification_logs?.[0]?.comments || "No reason provided",
                                                                    proof: listing.documents?.find((d: any) => d.file_type === 'proof')
                                                                });
                                                                setRejectionModalOpen(true);
                                                            }}
                                                        >
                                                            View Rejection Reason
                                                        </Button>
                                                    )}

                                                    {listing.verification_status !== 'pending' && (
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8 ml-1" onClick={async () => {
                                                            if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
                                                                try {
                                                                    await api.delete(`/properties/${listing.property_id}`);
                                                                    toast({ title: "Deleted", description: "Property deleted successfully." });
                                                                    fetchDashboardData();
                                                                } catch (e: any) {
                                                                    toast({ title: "Error", description: e.response?.data?.message || "Failed to delete property", variant: "destructive" });
                                                                }
                                                            }
                                                        }}>
                                                            <span className="sr-only">Delete</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Getting Started Checklist
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* KYC Item */}
                            {kycStatus !== 'approved' && (
                                <div
                                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${kycStatus === 'not_submitted' ? 'cursor-pointer hover:bg-accent/5' : ''}`}
                                    onClick={() => kycStatus === 'not_submitted' && setKycModalOpen(true)}
                                >
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        {kycStatus === 'pending' ? <Clock className="h-5 w-5 text-orange-500" /> : <Shield className="h-5 w-5 text-accent" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-semibold text-primary">Complete KYC Verification</h3>
                                            {kycStatus === 'pending' && <Badge variant="secondary">Pending Approval</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {kycStatus === 'pending'
                                                ? "Your documents are under review by the regulator."
                                                : "Verify your identity and ownership documents to list properties."}
                                        </p>
                                        {kycStatus === 'not_submitted' && <Badge variant="outline" className="text-pending border-pending">Required</Badge>}
                                    </div>
                                </div>
                            )}

                            {/* MFA Item */}
                            {!mfaEnabled && (
                                <div
                                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => router.push("/settings")}
                                >
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <Lock className="h-5 w-5 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-primary mb-1">Enable MFA</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Secure your account with Multi-Factor Authentication.
                                        </p>
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
                                            : "Link your Ethereum wallet to receive proceeds from token sales."}
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

                            {/* Create Listing Item */}

                            {listings.length === 0 && (
                                <div
                                    className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                                    onClick={() => setListingModalOpen(true)}
                                >
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <Plus className="h-5 w-5 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-primary mb-1">Create Your Listing</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Define token economics and submit for regulator approval.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Empty State if all done */}
                            {kycStatus === 'approved' && mfaEnabled && listings.length > 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                    <p>All checklist items completed!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Multi-Step Listing Modal */}
                <Dialog open={listingModalOpen} onOpenChange={setListingModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Listing - Step {currentStep} of 4</DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg mb-4">Property Information</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Property Title</Label>
                                        <Input
                                            id="title"
                                            value={listingData.title}
                                            onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                                            placeholder="e.g., Premium Commercial Plaza - F-7"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="propertyType">Property Type</Label>
                                            <Select
                                                value={listingData.propertyType}
                                                onValueChange={(value) => setListingData({ ...listingData, propertyType: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="residential">Residential</SelectItem>
                                                    <SelectItem value="commercial">Commercial</SelectItem>
                                                    <SelectItem value="industrial">Industrial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="valuation">Valuation (PKR)</Label>
                                            <Input
                                                id="valuation"
                                                type="number"
                                                value={listingData.valuation}
                                                onChange={(e) => setListingData({ ...listingData, valuation: e.target.value })}
                                                placeholder="50000000"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            value={listingData.address}
                                            onChange={(e) => setListingData({ ...listingData, address: e.target.value })}
                                            placeholder="Full property address"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={listingData.description}
                                            onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                                            placeholder="Describe the property features and investment potential..."
                                            className="h-24"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg mb-4">Token Economics</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="totalTokens">Total Tokens</Label>
                                        <Input
                                            id="totalTokens"
                                            type="number"
                                            value={listingData.totalTokens}
                                            onChange={(e) => {
                                                const tokens = e.target.value;
                                                const valuation = parseFloat(listingData.valuation) || 0;
                                                const price = tokens ? (valuation / parseInt(tokens)).toFixed(2) : "";
                                                setListingData({
                                                    ...listingData,
                                                    totalTokens: tokens,
                                                    pricePerToken: price
                                                });
                                            }}
                                            placeholder="1000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tokensForSale">Tokens for Sale</Label>
                                        <Input
                                            id="tokensForSale"
                                            type="number"
                                            value={listingData.tokensForSale}
                                            onChange={(e) => setListingData({ ...listingData, tokensForSale: e.target.value })}
                                            placeholder="400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pricePerToken">Price per Token (PKR) - Auto Calculated</Label>
                                        <Input
                                            id="pricePerToken"
                                            type="number"
                                            value={listingData.pricePerToken}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Calculated as Valuation ({Number(listingData.valuation).toLocaleString()}) / Total Tokens
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg mb-4">Upload Documents</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="images">Property Images</Label>
                                        <Input
                                            id="images"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setFiles({ ...files, images: Array.from(e.target.files) });
                                                }
                                            }}
                                        />
                                        {files.images.length > 0 && (
                                            <div className="text-sm text-muted-foreground mt-2">
                                                Selected: {files.images.map(f => f.name).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="docs">Legal Documents</Label>
                                        <Input
                                            id="docs"
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setFiles({ ...files, docs: Array.from(e.target.files) });
                                                }
                                            }}
                                        />
                                        {files.docs.length > 0 && (
                                            <div className="text-sm text-muted-foreground mt-2">
                                                Selected: {files.docs.map(f => f.name).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Required: Ownership deed, Valuation report, FBR documentation
                                    </p>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg mb-4">Review & Submit</h3>
                                    <div className="space-y-3 p-4 bg-muted rounded-lg text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Title</span>
                                            <span className="font-semibold">{listingData.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type</span>
                                            <span className="font-semibold capitalize">{listingData.propertyType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Valuation</span>
                                            <span className="font-semibold">PKR {Number(listingData.valuation).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Tokens</span>
                                            <span className="font-semibold">{listingData.totalTokens}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Price/Token</span>
                                            <span className="font-semibold">PKR {listingData.pricePerToken}</span>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <span className="text-muted-foreground block mb-1">Description</span>
                                            <p className="line-clamp-2">{listingData.description}</p>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <span className="text-muted-foreground block mb-1">Documents</span>
                                            <p>{files.images.length} Images, {files.docs.length} Documents</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        By submitting, you confirm all information is accurate and documents are valid.
                                        Your listing will be reviewed by regulators within 48 hours.
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex justify-between">
                            <div>
                                {currentStep > 1 && (
                                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setListingModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                                    {isSubmitting && currentStep > 1 ? "Saving..." : "Save as Draft"}
                                </Button>
                                {currentStep < 4 ? (
                                    <Button onClick={handleNextStep}>
                                        Next
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleSubmitListing(false)} disabled={isSubmitting}>
                                        {isSubmitting ? "Submitting..." : "Submit for Approval"}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* KYC Modal */}
                <KYCWizard
                    open={kycModalOpen}
                    onOpenChange={setKycModalOpen}
                    onSuccess={fetchDashboardData}
                />

                {/* Rejection Details Modal */}
                <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Listing Rejected
                            </DialogTitle>
                            <DialogDescription>
                                This listing was rejected by the regulator. Please address the issues below and resubmit.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Regulator Comments</Label>
                                <div className="p-3 bg-muted rounded-md text-sm border-l-4 border-destructive">
                                    {selectedRejection?.reason}
                                </div>
                            </div>

                            {selectedRejection?.proof && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Proof of Rejection</Label>
                                    <a
                                        href={`${API_URL}${selectedRejection.proof.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 border rounded-md hover:bg-muted transition-colors text-primary"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm font-medium">{selectedRejection.proof.file_name}</span>
                                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button onClick={() => setRejectionModalOpen(false)}>Close</Button>
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
                                Enter your Ethereum wallet address to receive proceeds from token sales.
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
        </div>
    );
}
