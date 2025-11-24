"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, MapPin } from "lucide-react";
import { mockPendingListings } from "@/lib/mockData";

export default function RegulatorListings() {
    const { toast } = useToast();
    const [listings, setListings] = useState(mockPendingListings);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [comments, setComments] = useState("");

    const handleApprove = () => {
        toast({
            title: "Listing Approved",
            description: `${selectedListing.title} has been approved and will be activated on the marketplace.`,
        });
        setListings(listings.filter((l) => l.id !== selectedListing.id));
        setSelectedListing(null);
        setComments("");
    };

    const handleRequestInfo = () => {
        if (!comments.trim()) {
            toast({
                title: "Comments Required",
                description: "Please specify what additional information is needed.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Information Requested",
            description: `Owner has been notified to provide additional documentation.`,
        });
        setSelectedListing(null);
        setComments("");
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">Listing Approval Queue</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {listings.map((listing, idx) => (
                        <Card key={listing.id} className="animate-slide-up hover:shadow-lg transition-shadow" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="relative h-48">
                                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-t-lg" />
                                <Badge className="absolute top-3 right-3" variant="secondary">
                                    Pending Review
                                </Badge>
                            </div>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {listing.address}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Owner</p>
                                        <p className="font-medium">{listing.ownerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Valuation</p>
                                        <p className="font-medium">PKR {(listing.valuation / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Tokens</p>
                                        <p className="font-medium">{listing.totalTokens}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">For Sale</p>
                                        <p className="font-medium">{listing.tokensForSale}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    {listing.documents.map((doc: any, i: number) => (
                                        <Badge key={i} variant="outline" className="gap-1">
                                            <FileText className="h-3 w-3" />
                                            {doc.name}
                                        </Badge>
                                    ))}
                                </div>

                                <Button onClick={() => setSelectedListing(listing)} className="w-full">
                                    Review Listing
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {listings.length === 0 && (
                        <Card className="md:col-span-2">
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No pending listings for review.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Review Listing</DialogTitle>
                    </DialogHeader>

                    {selectedListing && (
                        <div className="space-y-4">
                            <div className="relative h-64 rounded-lg overflow-hidden">
                                <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-full object-cover" />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-2">{selectedListing.title}</h3>
                                <p className="text-muted-foreground">{selectedListing.address}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-accent/10 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Valuation</p>
                                    <p className="font-semibold">PKR {selectedListing.valuation.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Tokens</p>
                                    <p className="font-semibold">{selectedListing.totalTokens}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">For Sale</p>
                                    <p className="font-semibold">{selectedListing.tokensForSale}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium mb-2">Documents</p>
                                <div className="space-y-2">
                                    {selectedListing.documents.map((doc: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span>{doc.name}</span>
                                            </div>
                                            <Button variant="link" size="sm">View PDF</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Regulator Comments</label>
                                <Textarea
                                    placeholder="Add approval comments or request additional information..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleRequestInfo}>
                            Request More Info
                        </Button>
                        <Button onClick={handleApprove} className="bg-verified text-verified-foreground hover:bg-verified/90">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Listing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
