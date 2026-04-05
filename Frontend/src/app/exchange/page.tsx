"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRightLeft, Building, Tag } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function SecondaryMarketExchange() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchListings = async () => {
        try {
            const res = await api.get("/exchange/listings");
            setListings(res.data);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
            toast({ title: "Error", description: "Could not load the secondary market.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleBuy = async (listingId: number) => {
        setProcessingId(listingId);
        try {
            const res = await api.post(`/exchange/listings/${listingId}/buy`);
            toast({
                title: "Trade Executed!",
                description: "Tokens have been successfully transferred to your wallet.",
            });
            // Refresh the board to remove the bought listing
            fetchListings();
        } catch (error: any) {
            toast({
                title: "Trade Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
                        <ArrowRightLeft className="mr-3 h-8 w-8" />
                        Secondary Market
                    </h1>
                    <p className="text-muted-foreground">
                        Browse and purchase token bundles directly from other investors.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                        <Tag className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <h3 className="text-xl font-bold text-primary mb-2">No Active Listings</h3>
                        <p className="text-muted-foreground">There are currently no tokens being sold on the secondary market.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => {
                            const isOwnListing = user?.user_id === listing.seller_id;
                            const property = listing.sukuk.property;
                            const pricePerToken = (listing.total_asking_price / listing.token_amount).toFixed(2);

                            return (
                                <Card key={listing.listing_id} className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2">P2P Bundle</Badge>
                                                <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                                    <Building className="w-3 h-3 mr-1" />
                                                    Listed by {listing.seller.name}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Bundle Size</p>
                                                <p className="font-bold text-lg">{listing.token_amount}</p>
                                            </div>
                                            <div className="w-px h-8 bg-border"></div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                                                <p className="font-bold text-lg text-accent">PKR {listing.total_asking_price}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Implied Token Price:</span>
                                            <span className="font-medium">PKR {pricePerToken}</span>
                                        </div>
                                    </CardContent>

                                    
                                    <CardFooter className="pt-2 flex flex-col gap-2">
                                        {/* NEW: View Property Details Button */}
                                        <Link href={`/marketplace/${property.property_id}`} className="w-full">
                                            <Button 
                                                variant="outline" 
                                                className="w-full text-xs h-8"
                                            >
                                                View Asset Details
                                            </Button>
                                        </Link>

                                        {/* EXISTING: Purchase Bundle Button */}
                                        <Button 
                                            className="w-full" 
                                            size="lg"
                                            disabled={isOwnListing || processingId === listing.listing_id}
                                            onClick={() => handleBuy(listing.listing_id)}
                                            variant={isOwnListing ? "secondary" : "default"}
                                        >
                                            {processingId === listing.listing_id ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Swap...</>
                                            ) : isOwnListing ? (
                                                "Your Listing"
                                            ) : (
                                                "Purchase Bundle"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            <Chatbot />
        </div>
    );
}