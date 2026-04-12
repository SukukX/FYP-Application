"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Chatbot } from "@/components/Chatbot";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRightLeft, Building, Tag, Clock } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function SecondaryMarketExchange() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    // NEW: Track how many tokens the user wants to buy for each listing
    const [buyAmounts, setBuyAmounts] = useState<Record<number, number>>({});
    
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchListings = async () => {
        try {
            const res = await api.get("/exchange/listings");
            setListings(res.data);
            
            // Initialize the buy amounts to 1 for every fetched listing
            const initialAmounts: Record<number, number> = {};
            res.data.forEach((l: any) => {
                initialAmounts[l.listing_id] = 1;
            });
            setBuyAmounts(initialAmounts);
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

    // NEW: Handle the partial buy amount changes safely
    const handleAmountChange = (listingId: number, value: number, maxAvailable: number) => {
        let safeValue = value;
        if (value < 1) safeValue = 1;
        if (value > maxAvailable) safeValue = maxAvailable;
        
        setBuyAmounts(prev => ({ ...prev, [listingId]: safeValue }));
    };

    const handleBuy = async (listingId: number) => {
        const tokensToBuy = buyAmounts[listingId];
        setProcessingId(listingId);
        
        try {
            // NEW: Send the tokens_to_buy payload to the backend
            const res = await api.post(`/exchange/listings/${listingId}/buy`, {
                tokens_to_buy: tokensToBuy
            });
            
            toast({
                title: "Trade Executed!",
                description: `Successfully purchased ${tokensToBuy} tokens.`,
            });
            fetchListings(); // Refresh board
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
                        Browse and purchase partial token shares directly from other investors.
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
                            
                            // NEW: Use the updated database schema columns
                            const pricePerToken = parseFloat(listing.price_per_token).toFixed(2);
                            const availableTokens = listing.available_tokens;
                            const currentBuyAmount = buyAmounts[listing.listing_id] || 1;
                            const totalCost = (currentBuyAmount * parseFloat(pricePerToken)).toFixed(2);
                            
                            // Format expiration date
                            const expiryDate = new Date(listing.expires_at).toLocaleDateString();

                            return (
                                <Card key={listing.listing_id} className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2 bg-blue-500/10 text-blue-500">Partial Buying</Badge>
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
                                                <p className="text-xs text-muted-foreground mb-1">Available</p>
                                                <p className="font-bold text-lg">{availableTokens}</p>
                                            </div>
                                            <div className="w-px h-8 bg-border"></div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground mb-1">Price per Token</p>
                                                <p className="font-bold text-lg text-accent">PKR {pricePerToken}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Expires: {expiryDate}</span>
                                            <span>Orig. Listed: {listing.total_tokens}</span>
                                        </div>

                                        {/* NEW: Partial Buy Input controls */}
                                        {!isOwnListing && (
                                            <div className="pt-2 border-t border-border/50">
                                                <label className="text-xs text-muted-foreground mb-2 block">How many tokens to buy?</label>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max={availableTokens}
                                                        value={currentBuyAmount}
                                                        onChange={(e) => handleAmountChange(listing.listing_id, parseInt(e.target.value) || 1, availableTokens)}
                                                        className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    />
                                                    <div className="flex-1 text-right">
                                                        <span className="text-xs text-muted-foreground">Total: </span>
                                                        <span className="font-bold text-sm">PKR {totalCost}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    
                                    <CardFooter className="pt-2 flex flex-col gap-2">
                                        <Link href={`/marketplace/${property.property_id}`} className="w-full">
                                            <Button variant="outline" className="w-full text-xs h-8">
                                                View Asset Details
                                            </Button>
                                        </Link>

                                        <Button 
                                            className="w-full" 
                                            size="lg"
                                            disabled={isOwnListing || processingId === listing.listing_id || availableTokens === 0}
                                            onClick={() => handleBuy(listing.listing_id)}
                                            variant={isOwnListing ? "secondary" : "default"}
                                        >
                                            {processingId === listing.listing_id ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Swap in progress...</>
                                            ) : isOwnListing ? (
                                                "Your Listing"
                                            ) : (
                                                `Buy ${currentBuyAmount} Token${currentBuyAmount > 1 ? 's' : ''}`
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