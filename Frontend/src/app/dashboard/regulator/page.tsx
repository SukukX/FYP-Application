"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, FileCheck, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";
import api from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


export default function RegulatorDashboard() {
    const [kycQueue, setKycQueue] = useState<any[]>([]);
    const [listingQueue, setListingQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewType, setReviewType] = useState<"kyc" | "listing">("kyc");
    const [reviewComments, setReviewComments] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const { toast } = useToast();
    const [stats, setStats] = useState({
        pendingKYC: 0,
        pendingListings: 0,
        approvedUsers: 0,
        approvedListings: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get("/dashboard/regulator");
            setKycQueue(res.data.kycQueue);
            setListingQueue(res.data.listingQueue || []);
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

    const handleApprove = async (item: any, type: "kyc" | "listing") => {
        try {
            if (type === "kyc") {
                await api.post("/kyc/approve", { userId: item.user_id });
                toast({
                    title: "KYC Approved",
                    description: `${item.user?.name}'s KYC has been approved.`,
                });
            } else {
                const formData = new FormData();
                formData.append("status", "approved");
                if (proofFile) formData.append("proof", proofFile);
                if (reviewComments) formData.append("remarks", reviewComments);

                await api.patch(`/properties/${item.property_id}/verify`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({
                    title: "Listing Approved",
                    description: `${item.title} has been approved for marketplace.`,
                });
            }
            setReviewModalOpen(false);
            setReviewComments("");
            setProofFile(null);
            fetchDashboardData(); // Refresh data
        } catch (error: any) {
            console.error("Handle Approve Error:", error);
            toast({
                title: "Action Failed",
                description: error.response?.data?.message || "Failed to approve",
                variant: "destructive",
            });
        }
    };

    const handleReject = async (item: any, type: "kyc" | "listing") => {
        if (!reviewComments.trim()) {
            toast({
                title: "Comments Required",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            });
            return;
        }

        try {
            if (type === "kyc") {
                await api.post("/kyc/reject", { userId: item.user_id, comments: reviewComments });
                toast({
                    title: "KYC Rejected",
                    description: `${item.user?.name}'s KYC has been rejected.`,
                    variant: "destructive",
                });
            } else {
                const formData = new FormData();
                formData.append("status", "rejected");
                formData.append("remarks", reviewComments);
                if (proofFile) formData.append("proof", proofFile);

                await api.patch(`/properties/${item.property_id}/verify`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                toast({
                    title: "Listing Rejected",
                    description: `${item.title} has been rejected.`,
                    variant: "destructive",
                });
            }
            setReviewModalOpen(false);
            setReviewComments("");
            setProofFile(null);
            fetchDashboardData(); // Refresh data
        } catch (error: any) {
            toast({
                title: "Action Failed",
                description: error.response?.data?.message || "Failed to reject",
                variant: "destructive",
            });
        }
    };

    const openReviewModal = (item: any, type: "kyc" | "listing") => {
        setSelectedItem(item);
        setReviewType(type);
        setReviewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold text-primary mb-2">Regulator Dashboard</h1>
                    <p className="text-muted-foreground">Verify KYC documents and approve property listings</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="animate-slide-up">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending KYC</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-pending">{kycQueue.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-pending">{listingQueue.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-verified">{stats.approvedUsers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Verified accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-verified">{stats.approvedListings}</div>
                            <p className="text-xs text-muted-foreground mt-1">Live on marketplace</p>
                        </CardContent>
                    </Card>
                </div>

                {/* KYC Verification Table */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            KYC Verification Queue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {kycQueue.length === 0 ? (
                            <div className="text-center py-12">
                                <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-primary mb-2">No Pending KYC Requests</h3>
                                <p className="text-muted-foreground">
                                    All KYC submissions have been processed.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>CNIC</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {kycQueue.map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell className="font-medium">{user.user?.name}</TableCell>
                                            <TableCell>{user.user?.email}</TableCell>
                                            <TableCell>{user.cnic_number}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.user?.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(user.submitted_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-pending text-primary">Pending</Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openReviewModal(user, "kyc")}
                                                >
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Listing Approval Table */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5" />
                            Listing Approval Queue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {listingQueue.length === 0 ? (
                            <div className="text-center py-12">
                                <FileCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-primary mb-2">No Pending Listings</h3>
                                <p className="text-muted-foreground">
                                    All property listings have been reviewed.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Valuation</TableHead>
                                        <TableHead>Tokens</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listingQueue.map((listing) => (
                                        <TableRow key={listing.property_id}>
                                            <TableCell className="font-medium">{listing.title}</TableCell>
                                            <TableCell>{listing.owner?.name}</TableCell>
                                            <TableCell>PKR {(listing.valuation / 1000000).toFixed(1)}M</TableCell>
                                            <TableCell>{listing.sukuks?.[0]?.total_tokens || "N/A"}</TableCell>
                                            <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-pending text-primary">Pending</Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openReviewModal(listing, "listing")}
                                                >
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Guidelines Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Regulator Guidelines
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary mb-1">KYC Verification Standards</h4>
                                    <p className="text-muted-foreground">
                                        Verify NADRA records, check document authenticity, and ensure all required forms are completed correctly.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary mb-1">Property Listing Review</h4>
                                    <p className="text-muted-foreground">
                                        Verify FBR documentation, ownership deeds, valuation reports, and ensure compliance with tokenization regulations.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold text-primary mb-1">SLA Expectations</h4>
                                    <p className="text-muted-foreground">
                                        Process KYC requests within 48 hours and listing approvals within 5 business days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Review Modal */}
            <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {reviewType === "kyc" ? "Review KYC Application" : "Review Property Listing"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedItem && (
                            <>
                                {reviewType === "listing" && (
                                    <>
                                        {selectedItem.documents?.filter((d: any) => d.file_type.startsWith("image/")).length > 0 && (
                                            <div className="mb-4">
                                                <span className="text-sm font-semibold text-muted-foreground block mb-2">Property Images</span>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {selectedItem.documents.filter((d: any) => d.file_type.startsWith("image/")).map((img: any, i: number) => (
                                                        <div key={i} className="h-24 w-32 flex-shrink-0 relative rounded-md overflow-hidden border">
                                                            <img src={`${API_URL}${img.file_path}`} alt={`Property ${i}`} className="object-cover w-full h-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3 p-4 bg-muted rounded-lg mb-4">
                                            <h4 className="font-semibold text-primary">Property Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground block">Title</span>
                                                    <span className="font-medium">{selectedItem.title}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Location</span>
                                                    <span className="font-medium">{selectedItem.location}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Valuation</span>
                                                    <span className="font-medium">PKR {(selectedItem.valuation / 1000000).toFixed(1)}M</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">Total Tokens</span>
                                                    <span className="font-medium">{selectedItem.sukuks?.[0]?.total_tokens || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-sm">Description</span>
                                                <p className="text-sm mt-1">{selectedItem.description}</p>
                                            </div>
                                        </div>

                                        {selectedItem.documents?.filter((d: any) => !d.file_type.startsWith("image/")).length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <span className="text-sm font-semibold text-muted-foreground block">Legal Documents</span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedItem.documents.filter((d: any) => !d.file_type.startsWith("image/")).map((doc: any, i: number) => (
                                                        <a
                                                            key={i}
                                                            href={`${API_URL}${doc.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center p-2 border rounded hover:bg-muted text-sm text-primary transition-colors"
                                                        >
                                                            <FileCheck className="h-4 w-4 mr-2" />
                                                            {doc.file_name}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="proof">Proof of Verification / Rejection (Optional)</Label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    id="proof"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Upload FBR report or other verification docs.</p>
                                        </div>
                                    </>
                                )}

                                {reviewType === "kyc" && (
                                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                                        {/* Existing KYC Details */}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Name</span>
                                            <span className="font-semibold">{selectedItem.user?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="font-semibold">{selectedItem.user?.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">CNIC</span>
                                            <span className="font-semibold">{selectedItem.cnic_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Role</span>
                                            <span className="font-semibold capitalize">{selectedItem.user?.role}</span>
                                        </div>
                                        {/* Add Image Links for KYC too if possible */}
                                        {selectedItem.cnic_front && (
                                            <div className="mt-2">
                                                <span className="text-xs text-muted-foreground block mb-1">CNIC Front</span>
                                                <img src={`${API_URL}${selectedItem.cnic_front}`} alt="CNIC Front" className="h-24 rounded border object-cover" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="comments">Comments / Reason</Label>
                                    <Textarea
                                        id="comments"
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        placeholder="Add comments or reason for rejection..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => handleReject(selectedItem, reviewType)}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => handleApprove(selectedItem, reviewType)}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Chatbot />
        </div >
    );
}
