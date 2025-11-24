"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, FileCheck, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { mockKYCQueue, mockPendingListings } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Chatbot } from "@/components/Chatbot";

export default function RegulatorDashboard() {
    const [kycQueue] = useState(mockKYCQueue);
    const [listingQueue] = useState(mockPendingListings);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewType, setReviewType] = useState<"kyc" | "listing">("kyc");
    const [reviewComments, setReviewComments] = useState("");
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const { toast } = useToast();

    const handleApprove = (item: any, type: "kyc" | "listing") => {
        if (type === "kyc") {
            toast({
                title: "KYC Approved",
                description: `${item.username}'s KYC has been approved.`,
            });
        } else {
            toast({
                title: "Listing Approved",
                description: `${item.title} has been approved for marketplace.`,
            });
        }
        setReviewModalOpen(false);
        setReviewComments("");
    };

    const handleReject = (item: any, type: "kyc" | "listing") => {
        if (!reviewComments.trim()) {
            toast({
                title: "Comments Required",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            });
            return;
        }

        if (type === "kyc") {
            toast({
                title: "KYC Rejected",
                description: `${item.username}'s KYC has been rejected.`,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Listing Rejected",
                description: `${item.title} has been rejected.`,
                variant: "destructive",
            });
        }
        setReviewModalOpen(false);
        setReviewComments("");
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
                            <div className="text-3xl font-bold text-verified">23</div>
                            <p className="text-xs text-muted-foreground mt-1">Verified accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="animate-slide-up" style={{ animationDelay: "300ms" }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-verified">12</div>
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
                                        <TableRow key={user.userId}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.cnic}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(user.submittedAt).toLocaleDateString()}</TableCell>
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
                                        <TableRow key={listing.id}>
                                            <TableCell className="font-medium">{listing.title}</TableCell>
                                            <TableCell>{listing.ownerName}</TableCell>
                                            <TableCell>PKR {(listing.valuation / 1000000).toFixed(1)}M</TableCell>
                                            <TableCell>{listing.totalTokens}</TableCell>
                                            <TableCell>{new Date(listing.submittedAt).toLocaleDateString()}</TableCell>
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
                                <div className="space-y-2 p-4 bg-muted rounded-lg">
                                    {reviewType === "kyc" ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name</span>
                                                <span className="font-semibold">{selectedItem.username}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Email</span>
                                                <span className="font-semibold">{selectedItem.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">CNIC</span>
                                                <span className="font-semibold">{selectedItem.cnic}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Role</span>
                                                <span className="font-semibold capitalize">{selectedItem.role}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Property</span>
                                                <span className="font-semibold">{selectedItem.title}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Valuation</span>
                                                <span className="font-semibold">PKR {(selectedItem.valuation / 1000000).toFixed(1)}M</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Total Tokens</span>
                                                <span className="font-semibold">{selectedItem.totalTokens}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comments">Comments / Reason</Label>
                                    <Textarea
                                        id="comments"
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        placeholder="Add comments or reason for rejection..."
                                        rows={4}
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
        </div>
    );
}
