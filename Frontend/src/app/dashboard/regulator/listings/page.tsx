"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, MapPin, FileCheck, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";

export default function RegulatorListings() {
    const { toast } = useToast();
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [comments, setComments] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchListingQueue();
    }, []);

    const fetchListingQueue = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/dashboard/regulator");
            setListings(res.data.listingQueue || []);
        } catch (error) {
            console.error("Failed to fetch listing queue:", error);
            toast({ title: "Error", description: "Failed to load listing queue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedListing) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("status", "approved");
            if (comments) formData.append("remarks", comments);
            if (proofFile) formData.append("proof", proofFile);

            await api.patch(`/properties/${selectedListing.property_id}/verify`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast({ title: "Listing Approved", description: `${selectedListing.title} is now live on the marketplace.` });
            setListings(listings.filter((l) => l.property_id !== selectedListing.property_id));
            setSelectedListing(null);
            setComments("");
            setProofFile(null);
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Failed to approve listing.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedListing) return;
        if (!comments.trim()) {
            toast({ title: "Comments Required", description: "Please provide a reason for rejection.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("status", "rejected");
            formData.append("remarks", comments);
            if (proofFile) formData.append("proof", proofFile);

            await api.patch(`/properties/${selectedListing.property_id}/verify`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast({ title: "Listing Rejected", description: `${selectedListing.title} has been rejected.`, variant: "destructive" });
            setListings(listings.filter((l) => l.property_id !== selectedListing.property_id));
            setSelectedListing(null);
            setComments("");
            setProofFile(null);
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Failed to reject listing.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPropertyImage = (listing: any) => {
        const imgDoc = listing.documents?.find((d: any) => d.file_type?.startsWith("image/"));
        return imgDoc ? getFileUrl(imgDoc.file_path) : "/placeholder-property.jpg";
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">Listing Approval Queue</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {listings.map((listing, idx) => (
                            <Card key={listing.property_id} className="animate-slide-up hover:shadow-lg transition-shadow overflow-hidden" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="relative h-48 bg-muted">
                                    <img
                                        src={getPropertyImage(listing)}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <Badge className="absolute top-3 right-3 bg-pending text-primary-foreground">Pending Review</Badge>
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                        {listing.location || listing.address}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Owner</p>
                                            <p className="font-medium">{listing.owner?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Valuation</p>
                                            <p className="font-medium">PKR {(listing.valuation / 1000000).toFixed(1)}M</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total Tokens</p>
                                            <p className="font-medium">{listing.sukuks?.[0]?.total_tokens ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Submitted</p>
                                            <p className="font-medium">{new Date(listing.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap mb-4">
                                        {listing.documents?.filter((d: any) => !d.file_type?.startsWith("image/")).map((doc: any, i: number) => (
                                            <Badge key={i} variant="outline" className="gap-1">
                                                <FileText className="h-3 w-3" />
                                                {doc.file_name}
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
                                <CardContent className="py-16 text-center">
                                    <FileCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-40" />
                                    <h3 className="text-lg font-semibold text-primary mb-2">No Pending Listings</h3>
                                    <p className="text-muted-foreground">All property listings have been reviewed.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <Dialog open={!!selectedListing} onOpenChange={() => { setSelectedListing(null); setComments(""); setProofFile(null); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review Listing — {selectedListing?.title}</DialogTitle>
                    </DialogHeader>

                    {selectedListing && (
                        <div className="space-y-4 py-2">
                            {/* Property Images */}
                            {selectedListing.documents?.filter((d: any) => d.file_type?.startsWith("image/")).length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedListing.documents.filter((d: any) => d.file_type?.startsWith("image/")).map((img: any, i: number) => (
                                        <div key={i} className="h-32 w-48 flex-shrink-0 rounded-md overflow-hidden border">
                                            <img src={getFileUrl(img.file_path)} alt={`Property ${i}`} className="object-cover w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Property Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                                <div>
                                    <p className="text-muted-foreground">Owner</p>
                                    <p className="font-medium">{selectedListing.owner?.name} ({selectedListing.owner?.email})</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Property Type</p>
                                    <p className="font-medium capitalize">{selectedListing.property_type}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Valuation</p>
                                    <p className="font-medium">PKR {selectedListing.valuation?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Tokens</p>
                                    <p className="font-medium">{selectedListing.sukuks?.[0]?.total_tokens ?? "N/A"}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedListing.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm">{selectedListing.description}</p>
                                </div>
                            )}

                            {/* Legal Documents */}
                            {selectedListing.documents?.filter((d: any) => !d.file_type?.startsWith("image/")).length > 0 && (
                                <div>
                                    <p className="font-medium mb-2 text-sm">Legal Documents</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedListing.documents.filter((d: any) => !d.file_type?.startsWith("image/")).map((doc: any, i: number) => (
                                            <a
                                                key={i}
                                                href={getFileUrl(doc.file_path, true)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center p-2 border rounded hover:bg-muted text-sm text-primary transition-colors gap-2"
                                            >
                                                <FileCheck className="h-4 w-4 flex-shrink-0" />
                                                {doc.file_name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Proof of Verification Upload */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Upload Proof of Decision (Optional)</label>
                                <input
                                    type="file"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">e.g. FBR verification report or approval letter.</p>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Regulator Comments (required for rejection)</label>
                                <Textarea
                                    placeholder="Add approval notes or reason for rejection..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button onClick={handleApprove} disabled={isSubmitting} className="bg-verified text-verified-foreground hover:bg-verified/90">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Approve Listing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
