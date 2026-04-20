"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, ArrowLeft, Loader2, CheckCircle, XCircle, FileText, User, Search, TrendingUp, AlertTriangle, Shield, Activity } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Chatbot } from "@/components/Chatbot";
import { Input } from "@/components/ui/input";

export default function AuditLogsPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterModule, setFilterModule] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterModule, debouncedQuery]);

    useEffect(() => {
        fetchLogs();
    }, [filterModule]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            // Construct query string based on filter
            let endpoint = "/dashboard/logs";
            if (filterModule !== "ALL") {
                endpoint += `?module=${filterModule}`;
            }

            const res = await api.get(endpoint);
            setLogs(res.data.logs || []);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            toast({
                title: "Error",
                description: "Failed to load audit logs.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = () => {
        return {
            total: logs.length,
            approved: logs.filter(l => l.action === 'APPROVED').length,
            rejected: logs.filter(l => l.action === 'REJECTED').length
        };
    };

    const filteredLogs = logs.filter(log => {
        const query = debouncedQuery.toLowerCase();
        const matchesSearch =
            (log.targetName?.toLowerCase() || "").includes(query) ||
            (log.details?.remarks?.toLowerCase() || "").includes(query) ||
            (log.details?.reason?.toLowerCase() || "").includes(query) ||
            (log.user?.name?.toLowerCase() || "").includes(query);
        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getActionIcon = (action: string) => {
        switch (action) {
            case "APPROVED": return <CheckCircle className="h-4 w-4 text-verified" />;
            case "REJECTED": return <XCircle className="h-4 w-4 text-destructive" />;
            default: return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getModuleBadge = (module: string) => {
        const baseClass = "gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105";
        if (module === "KYC") {
            return <Badge variant="outline" className={`${baseClass} border-blue-500/30 text-blue-500 bg-blue-500/5`}><User className="h-3 w-3" /> KYC</Badge>;
        }
        if (module === "USER_MGMT") {
            return <Badge variant="outline" className={`${baseClass} border-orange-500/30 text-orange-500 bg-orange-500/5`}><Shield className="h-3 w-3" /> ADMIN</Badge>;
        }
        return <Badge variant="outline" className={`${baseClass} border-purple-500/30 text-purple-500 bg-purple-500/5`}><FileText className="h-3 w-3" /> PROPERTY</Badge>;
    };

    const stats = calculateStats();

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
                {/* Header Section - Matching Investor Dashboard */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard/regulator">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary transition-all">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">System Audit Logs</h1>
                        <p className="text-muted-foreground">Track all platform regulatory decisions and history</p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground px-3 py-1 flex items-center gap-1.5 h-fit">
                        <ClipboardList className="h-3 w-3" />
                        Regulator Oversight
                    </Badge>
                </div>

                {/* Stats Cards - Matching Investor Dashboard (Simple & Clean) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activity</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">Platform-wide events</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Decisions</CardTitle>
                            <CheckCircle className="h-4 w-4 text-verified" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-verified">{stats.approved}</div>
                            <p className="text-xs text-muted-foreground mt-1">Decision approvals</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Denials</CardTitle>
                            <XCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">{stats.rejected}</div>
                            <p className="text-xs text-muted-foreground mt-1">Regulatory rejections</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b border-muted/20 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                Comprehensive Audit Trail
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Detailed history of all administrative events</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search logs..." 
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={filterModule} onValueChange={setFilterModule}>
                                <SelectTrigger className="w-[160px] h-9">
                                    <SelectValue placeholder="All Modules" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Modules</SelectItem>
                                    <SelectItem value="KYC">KYC Requests</SelectItem>
                                    <SelectItem value="PROPERTY">Property Listings</SelectItem>
                                    <SelectItem value="USER_MGMT">Admin Actions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-24 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                                <p className="text-sm text-muted-foreground font-medium animate-pulse">Syncing with blockchain...</p>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-24 flex flex-col items-center">
                                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 border border-border/30">
                                    <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-2">Trail end reached</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                    No records match your search criteria. Try broadening your query or selecting another module.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="hover:bg-transparent border-b border-muted/20">
                                            <TableHead className="w-[180px] font-semibold text-primary py-4">Timestamp</TableHead>
                                            <TableHead className="font-semibold text-primary py-4">Module</TableHead>
                                            <TableHead className="font-semibold text-primary py-4">Target Item</TableHead>
                                            <TableHead className="font-semibold text-primary py-4">Status</TableHead>
                                            <TableHead className="font-semibold text-primary py-4">Authorized By</TableHead>
                                            <TableHead className="font-semibold text-primary py-4 text-right">Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedLogs.map((log) => (
                                            <TableRow key={log.log_id} className="hover:bg-muted/30 transition-all border-b border-muted/20">
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {getModuleBadge(log.module)}
                                                </TableCell>
                                                <TableCell className="font-medium text-primary">
                                                    {log.targetName || `ID: ${log.targetId}`}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-xs font-bold uppercase ${
                                                        log.action === 'APPROVED' ? 'text-verified' : 
                                                        log.action === 'REJECTED' ? 'text-destructive' : 'text-primary'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/5">
                                                            {log.user?.name?.[0] || (log.actorRole ? 'D' : 'S')}
                                                        </div>
                                                        <span className="text-sm text-primary font-medium">{log.user?.name || (log.actorRole ? 'Deleted User' : 'System')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground text-right italic max-w-[200px] truncate" title={log.details?.remarks || log.details?.reason || log.details?.comments || '-'}>
                                                    {log.details?.remarks || log.details?.reason || log.details?.comments || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>

                    {/* Pagination Controls */}
                    {!isLoading && filteredLogs.length > 0 && (
                        <div className="border-t border-border/10 p-4 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-bold text-primary">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-primary">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)}</span> of <span className="font-bold text-primary">{filteredLogs.length}</span> results
                            </div>

                            {totalPages > 1 && (
                                <Pagination className="w-auto mx-0">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page} className="hidden sm:inline-block">
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </div>
                    )}
                </Card>
            </div>
            <Chatbot />
        </div>
    );
}