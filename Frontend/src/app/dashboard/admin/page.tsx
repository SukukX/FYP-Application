"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Shield,
    Users,
    ClipboardList,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    Loader2,
    Activity,
    TrendingUp,
    Ban,
    UserCheck,
    Building2,
    Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getFileUrl } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data State
    const [data, setData] = useState<any>({
        queue: [],
        stats: { totalUsers: 0, totalProperties: 0, totalValuation: 0 },
        users: [],
        properties: [],
        logs: []
    });

    // Modal States
    const [regulatorModalOpen, setRegulatorModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [userSearch, setUserSearch] = useState("");

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.push("/dashboard");
            return;
        }
        if (user?.role === "admin") {
            fetchAdminData();
        }
    }, [user, authLoading]);

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/admin/overview");
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            toast({
                title: "Error",
                description: "Failed to load platform data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveRegulator = async () => {
        if (!selectedRequest || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post("/admin/regulators/approve", { userId: selectedRequest.user_id });
            toast({ title: "Regulator Approved", description: `${selectedRequest.user?.name} is now verified.` });
            setRegulatorModalOpen(false);
            fetchAdminData();
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectRegulator = async () => {
        if (!selectedRequest || !rejectReason.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post("/admin/regulators/reject", { userId: selectedRequest.user_id, reason: rejectReason });
            toast({ title: "Regulator Rejected", variant: "destructive" });
            setRegulatorModalOpen(false);
            setRejectReason("");
            fetchAdminData();
        } catch (error: any) {
            toast({ title: "Action Failed", description: error.response?.data?.message || "Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post("/admin/users/toggle-status", { userId });
            toast({
                title: currentStatus ? "Account Deactivated" : "Account Activated",
                description: `Successfully ${currentStatus ? 'banned' : 'unbanned'} user.`,
            });
            fetchAdminData();
        } catch (error: any) {
            toast({
                title: "Action Failed",
                description: error.response?.data?.message || "Error",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = data.users.filter((u: any) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-2">Platform Control Center</h1>
                        <p className="text-muted-foreground">Comprehensive oversight and platform governance</p>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 text-sm border-accent/30 text-accent bg-accent/5">
                        <Shield className="w-4 h-4 mr-2" /> Global Administrator
                    </Badge>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{data.stats.totalUsers}</div>
                            <div className="flex items-center text-xs text-green-500 mt-1">
                                <Activity className="w-3 h-3 mr-1" /> Platform Live
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Regulators</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${data.queue.length > 0 ? 'text-accent' : ''}`}>
                                {data.queue.length}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 text-accent">Awaiting Authorization</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Managed Properties</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{data.stats.totalProperties}</div>
                            <div className="text-xs text-muted-foreground mt-1">Marketplace Assets</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total TVL</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-verified">PKR {(data.stats.totalValuation / 1000000).toFixed(1)}M</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <TrendingUp className="w-3 h-3 mr-1 text-verified" /> Total Value Locked
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="regulators" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="flex gap-1 p-1 bg-muted/50 border border-border/50 rounded-lg w-fit shadow-sm h-auto relative z-10">
                            {[
                                { value: "regulators", label: "Regulator Auth", icon: Shield },
                                { value: "users", label: "User Management", icon: Users },
                                { value: "properties", label: "Property Monitor", icon: Building2 },
                                { value: "audit", label: "Audit Trails", icon: ClipboardList }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="px-6 py-2 rounded-md transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex items-center gap-2 whitespace-nowrap text-sm font-medium"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* REGULATOR AUTH TAB */}
                    <TabsContent value="regulators" className="animate-fade-in">
                        <Card className="border-accent/10 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" /> Regulator Onboarding Queue
                                </CardTitle>
                                <CardDescription>Directly authorize new regulatory officials</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.queue.length === 0 ? (
                                    <div className="text-center py-16 bg-muted/20 border-2 border-dashed rounded-lg">
                                        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="font-semibold text-primary">No Pending Regulators</h3>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Official Name</TableHead>
                                                <TableHead>Email Address</TableHead>
                                                <TableHead>Date Applied</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.queue.map((req: any) => (
                                                <TableRow key={req.user_id}>
                                                    <TableCell className="font-semibold">{req.user?.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{req.user?.email}</TableCell>
                                                    <TableCell>{new Date(req.submitted_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="hover:bg-accent/10 border-accent/20"
                                                            onClick={() => { setSelectedRequest(req); setRegulatorModalOpen(true); }}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" /> Review Identity
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* USER MANAGEMENT TAB */}
                    <TabsContent value="users" className="animate-fade-in">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Global Identity Directory</CardTitle>
                                    <CardDescription>Monitor all platform participants and manage access status</CardDescription>
                                </div>
                                <div className="relative w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-9"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Identity</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Protection</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((u: any) => (
                                            <TableRow key={u.user_id}>
                                                <TableCell>
                                                    <div className="font-medium">{u.name}</div>
                                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="capitalize text-[10px]">{u.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {u.is_active ? (
                                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">Banned</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={u.is_active ? "destructive" : "default"}
                                                        className={u.is_active ? "h-8 px-2" : "h-8 px-2 bg-green-600 hover:bg-green-700"}
                                                        onClick={() => toggleUserStatus(u.user_id, u.is_active)}
                                                        disabled={isSubmitting || u.role === 'admin'}
                                                    >
                                                        {u.is_active ? (
                                                            <><Ban className="w-3 h-3 mr-1" /> Deactivate</>
                                                        ) : (
                                                            <><UserCheck className="w-3 h-3 mr-1" /> Restore</>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PROPERTY MONITOR TAB */}
                    <TabsContent value="properties" className="animate-fade-in">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Asset Oversight</CardTitle>
                                <CardDescription>Read-only monitoring of all property listings and regulator actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Property</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Valuation</TableHead>
                                            <TableHead>Auth Status</TableHead>
                                            <TableHead className="text-right">Inventory</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.properties.map((p: any) => (
                                            <TableRow key={p.property_id}>
                                                <TableCell className="font-semibold">{p.title}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{p.location}</TableCell>
                                                <TableCell className="text-sm">{p.owner?.name}</TableCell>
                                                <TableCell className="text-sm font-medium">PKR {(p.valuation / 1000000).toFixed(1)}M</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize text-[10px] ${p.verification_status === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                                            p.verification_status === 'pending' ? 'border-orange-500 text-orange-600 bg-orange-50' : ''
                                                        }`}>
                                                        {p.verification_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">View Only</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AUDIT LOGS TAB */}
                    <TabsContent value="audit" className="animate-fade-in">
                        <Card>
                            <CardHeader>
                                <CardTitle>System-Wide Audit Trail</CardTitle>
                                <CardDescription>Traceable record of all administrative and regulatory events</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Actor</TableHead>
                                            <TableHead>Module</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead className="text-right">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.logs.map((log: any) => (
                                            <TableRow key={log.log_id} className="text-xs">
                                                <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                                                            {log.user?.name?.[0] || 'S'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-primary">{log.user?.name || "System"}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                                                                {log.actorRole || "System"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge className="bg-primary/5 text-primary text-[10px]">{log.module}</Badge></TableCell>
                                                <TableCell>
                                                    <span className={`font-bold ${log.action === 'APPROVED' ? 'text-green-600' :
                                                            log.action === 'REJECTED' ? 'text-red-500' : ''
                                                        }`}>{log.action}</span>
                                                </TableCell>
                                                <TableCell className="font-medium">{log.targetName}</TableCell>
                                                <TableCell 
                                                    className="text-right text-muted-foreground italic max-w-[200px] truncate" 
                                                    title={log.details?.remarks || log.details?.reason || log.details?.comments || log.details?.status || "Platform sync"}
                                                >
                                                    {log.details?.remarks || log.details?.reason || log.details?.comments || log.details?.status || "Platform sync"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Regulator Identity Dialog */}
            <Dialog open={regulatorModalOpen} onOpenChange={setRegulatorModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Regulator Identity Inspection</DialogTitle>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg">
                                <div><Label className="text-xs text-muted-foreground uppercase">Candidate</Label><p className="font-bold">{selectedRequest.user?.name}</p></div>
                                <div><Label className="text-xs text-muted-foreground uppercase">Email</Label><p className="font-bold">{selectedRequest.user?.email}</p></div>
                                <div><Label className="text-xs text-muted-foreground uppercase">CNIC #</Label><p className="font-bold">{selectedRequest.cnic_number}</p></div>
                                <div><Label className="text-xs text-muted-foreground uppercase">Applied On</Label><p className="font-bold">{new Date(selectedRequest.submitted_at).toLocaleDateString()}</p></div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold">Verification Documents</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-center border p-2 rounded">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Front Identity</span>
                                        <img src={getFileUrl(selectedRequest.cnic_front)} className="w-full h-32 object-cover rounded" alt="Front" />
                                    </div>
                                    <div className="space-y-2 text-center border p-2 rounded">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Back Identity</span>
                                        <img src={getFileUrl(selectedRequest.cnic_back)} className="w-full h-32 object-cover rounded" alt="Back" />
                                    </div>
                                    {selectedRequest.face_scan && (
                                        <div className="col-span-2 text-center py-4 bg-accent/5 rounded-lg border border-accent/10">
                                            <span className="text-[10px] font-bold text-accent uppercase mb-2 block">Live Face Matching Path</span>
                                            <img src={getFileUrl(selectedRequest.face_scan)} className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-xl" alt="Face" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-4 border-t">
                                <Label htmlFor="reason" className="text-red-500">Rejection Protocol (Reason required for rejecting application)</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Enter detailed reason for rejection..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="border-red-100 focus:ring-red-200"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                            onClick={handleRejectRegulator}
                        >
                            Decline Official
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                            onClick={handleApproveRegulator}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                            Authorize Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
