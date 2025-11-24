"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, User } from "lucide-react";
import { mockKYCQueue } from "@/lib/mockData";

export default function RegulatorKYC() {
    const { toast } = useToast();
    const [queue, setQueue] = useState(mockKYCQueue);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [comments, setComments] = useState("");

    const handleApprove = () => {
        toast({
            title: "KYC Approved",
            description: `User ${selectedUser.username} has been verified and added to whitelist.`,
        });
        setQueue(queue.filter((u) => u.userId !== selectedUser.userId));
        setSelectedUser(null);
        setComments("");
    };

    const handleReject = () => {
        if (!comments.trim()) {
            toast({
                title: "Comments Required",
                description: "Please provide a reason for rejection.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "KYC Rejected",
            description: `User ${selectedUser.username} has been rejected.`,
            variant: "destructive",
        });
        setQueue(queue.filter((u) => u.userId !== selectedUser.userId));
        setSelectedUser(null);
        setComments("");
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">KYC Verification Queue</h1>

                <div className="space-y-4">
                    {queue.map((user, idx) => (
                        <Card key={user.userId} className="animate-slide-up hover:shadow-lg transition-shadow" style={{ animationDelay: `${idx * 100}ms` }}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{user.username}</h3>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Email</p>
                                                    <p>{user.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">CNIC</p>
                                                    <p>{user.cnic}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">DOB</p>
                                                    <p>{user.dob}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Submitted</p>
                                                    <p>{new Date(user.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                {user.documents.map((doc: any, i: number) => (
                                                    <Badge key={i} variant="secondary" className="gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {doc.type.replace("_", " ")}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={() => setSelectedUser(user)}>
                                        Review
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {queue.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No pending KYC verifications.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review KYC - {selectedUser?.username}</DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-accent/10 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">CNIC</p>
                                    <p className="font-medium">{selectedUser.cnic}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                                    <p className="font-medium">{selectedUser.dob}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Role</p>
                                    <p className="font-medium capitalize">{selectedUser.role}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium mb-2">Submitted Documents</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {selectedUser.documents.map((doc: any, i: number) => (
                                        <div key={i} className="border rounded-lg p-4 text-center">
                                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-xs">{doc.type.replace("_", " ")}</p>
                                            <Button variant="link" size="sm" className="text-xs">View</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Regulator Comments</label>
                                <Textarea
                                    placeholder="Add comments or rejection reason..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleReject} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button onClick={handleApprove} className="bg-verified text-verified-foreground hover:bg-verified/90">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve & Whitelist
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
