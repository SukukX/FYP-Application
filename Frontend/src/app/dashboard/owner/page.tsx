"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";
import api from "@/lib/api";

export default function OwnerDashboard() {
    const [listingModalOpen, setListingModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalTokensSold: 0,
        totalRevenue: 0
    });

    const [listingData, setListingData] = useState({
        title: "",
        address: "",
        valuation: "",
        totalTokens: "",
        tokensForSale: "",
        pricePerToken: "",
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/dashboard/owner");
            setListings(res.data.listings);
            setStats(res.data.stats);
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
        }
        setCurrentStep(currentStep + 1);
    };

    const handleSubmitListing = async () => {
        try {
            // Create FormData for file upload support (even if we're just sending text for now)
            // In a real app, we'd append the files here
            const formData = new FormData();
            Object.entries(listingData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            await api.post("/properties", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({
                title: "Listing Submitted",
                description: "Your property listing has been submitted for regulator verification.",
            });

            setListingModalOpen(false);
            setCurrentStep(1);
            setListingData({
                title: "",
                address: "",
                valuation: "",
                totalTokens: "",
                tokensForSale: "",
                pricePerToken: "",
            });
            fetchDashboardData(); // Refresh data
        } catch (error: any) {
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Failed to submit listing",
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
                            <div className="text-3xl font-bold text-primary">{stats.totalProperties}</div>
                            <p className="text-xs text-muted-foreground mt-1">Properties listed</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Sold</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.totalTokensSold}</div>
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
                                    <Card key={listing.id} className="border-2 hover:border-accent/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-primary mb-1">{listing.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{listing.address}</p>
                                                </div>
                                                <Badge variant={listing.status === 'approved' ? 'default' : 'secondary'}>
                                                    {listing.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Tokens Available</span>
                                                    <span className="font-semibold">{listing.tokens_available || 0} / {listing.total_tokens}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className="bg-accent h-2 rounded-full transition-all"
                                                        style={{ width: `${((listing.tokens_available || 0) / listing.total_tokens) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <Link href={`/marketplace/${listing.id}`}>
                                                <Button variant="outline" className="w-full">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </CardContent>
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
                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Shield className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Complete KYC Verification</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Verify your identity and ownership documents to list properties.
                                    </p>
                                    <Badge variant="outline" className="text-pending border-pending">Required</Badge>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary mb-1">Prepare Property Documents</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Gather ownership deeds, valuation reports, and legal documents.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 border rounded-lg">
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
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                    <Label htmlFor="valuation">Property Valuation (PKR)</Label>
                                    <Input
                                        id="valuation"
                                        type="number"
                                        value={listingData.valuation}
                                        onChange={(e) => setListingData({ ...listingData, valuation: e.target.value })}
                                        placeholder="50000000"
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
                                        onChange={(e) => setListingData({ ...listingData, totalTokens: e.target.value })}
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
                                    <Label htmlFor="pricePerToken">Price per Token (PKR)</Label>
                                    <Input
                                        id="pricePerToken"
                                        type="number"
                                        value={listingData.pricePerToken}
                                        onChange={(e) => setListingData({ ...listingData, pricePerToken: e.target.value })}
                                        placeholder="50000"
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">Upload Documents</h3>
                                <div className="space-y-2">
                                    <Label>Property Images</Label>
                                    <Button variant="outline" className="w-full">
                                        Upload Images (Max 10, 5MB each)
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Legal Documents</Label>
                                    <Button variant="outline" className="w-full">
                                        Upload PDFs (Max 20MB each)
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Required: Ownership deed, Valuation report, FBR documentation
                                </p>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4">Review & Submit</h3>
                                <div className="space-y-3 p-4 bg-muted rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Title</span>
                                        <span className="font-semibold">{listingData.title}</span>
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
                                        <span className="text-muted-foreground">Tokens for Sale</span>
                                        <span className="font-semibold">{listingData.tokensForSale}</span>
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
                            {currentStep < 4 ? (
                                <Button onClick={handleNextStep}>
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmitListing}>
                                    Submit for Approval
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Chatbot />
        </div>
    );
}
