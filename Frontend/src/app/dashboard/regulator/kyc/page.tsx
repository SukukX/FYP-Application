"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, User, Shield, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";

export default function RegulatorKYC() {
    const { toast } = useToast();
    const [queue, setQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchKYCQueue();
    }, []);

    const fetchKYCQueue = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/dashboard/regulator");
            setQueue(res.data.kycQueue || []);
        } catch (error) {
            console.error("Failed to fetch KYC queue:", error);
            toast({ title: "Error", description: "Failed to load KYC queue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await api.post("/kyc/approve", { userId: selectedUser.user_id });
            toast({ title: "KYC Approved", description: `${selectedUser.user?.name}'s identity has been verified.` });
            setQueue(queue.filter((u) => u.user_id !== selectedUser.user_id));
            setSelectedUser(null);
            setComments("");
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Failed to approve KYC.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        if (!comments.trim()) {
            toast({ title: "Comments Required", description: "Please provide a reason for rejection.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post("/kyc/reject", { userId: selectedUser.user_id, comments });
            toast({ title: "KYC Rejected", description: `${selectedUser.user?.name}'s KYC has been rejected.`, variant: "destructive" });
            setQueue(queue.filter((u) => u.user_id !== selectedUser.user_id));
            setSelectedUser(null);
            setComments("");
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Failed to reject KYC.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">KYC Verification Queue</h1>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {queue.map((item, idx) => (
                            <Card key={item.user_id} className="animate-slide-up hover:shadow-lg transition-shadow" style={{ animationDelay: `${idx * 80}ms` }}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">{item.user?.name}</h3>
                                                    <Badge variant="outline" className="capitalize">{item.user?.role}</Badge>
                                                    <Badge className="bg-pending text-primary-foreground">Pending</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Email</p>
                                                        <p>{item.user?.email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">CNIC</p>
                                                        <p>{item.cnic_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Submitted</p>
                                                        <p>{new Date(item.submitted_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={() => setSelectedUser(item)}>Review</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {queue.length === 0 && (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-40" />
                                    <h3 className="text-lg font-semibold text-primary mb-2">No Pending KYC Requests</h3>
                                    <p className="text-muted-foreground">All KYC submissions have been processed.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setComments(""); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review KYC — {selectedUser?.user?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedUser.user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Role</p>
                                    <p className="font-medium capitalize">{selectedUser.user?.role}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">CNIC</p>
                                    <p className="font-medium">{selectedUser.cnic_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Submitted</p>
                                    <p className="font-medium">{new Date(selectedUser.submitted_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* CNIC Images */}
                            {(selectedUser.cnic_front || selectedUser.cnic_back) && (
                                <div className="flex gap-4">
                                    {selectedUser.cnic_front && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">CNIC Front</p>
                                            <img src={getFileUrl(selectedUser.cnic_front)} alt="CNIC Front" className="h-28 rounded border object-cover" />
                                        </div>
                                    )}
                                    {selectedUser.cnic_back && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">CNIC Back</p>
                                            <img src={getFileUrl(selectedUser.cnic_back)} alt="CNIC Back" className="h-28 rounded border object-cover" />
                                        </div>
                                    )}
                                    {selectedUser.face_scan && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Face Scan</p>
                                            <img src={getFileUrl(selectedUser.face_scan)} alt="Face Scan" className="h-28 rounded border object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-2 block">Regulator Comments (required for rejection)</label>
                                <Textarea
                                    placeholder="Add comments or reason for rejection..."
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
                            Approve & Whitelist
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
