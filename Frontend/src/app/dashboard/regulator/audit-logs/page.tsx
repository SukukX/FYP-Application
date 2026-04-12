"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, ArrowLeft, Loader2, CheckCircle, XCircle, FileText, User } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function AuditLogsPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterModule, setFilterModule] = useState<string>("ALL");

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

    const getActionIcon = (action: string) => {
        switch (action) {
            case "APPROVED": return <CheckCircle className="h-4 w-4 text-verified" />;
            case "REJECTED": return <XCircle className="h-4 w-4 text-destructive" />;
            default: return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getModuleBadge = (module: string) => {
        if (module === "KYC") {
            return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-500"><User className="h-3 w-3" /> KYC</Badge>;
        }
        return <Badge variant="outline" className="gap-1 border-purple-500 text-purple-500"><FileText className="h-3 w-3" /> PROPERTY</Badge>;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard/regulator">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                            <ClipboardList className="h-8 w-8 text-accent" />
                            System Audit Logs
                        </h1>
                        <p className="text-muted-foreground mt-1">Immutable record of all regulatory decisions.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                        <Select value={filterModule} onValueChange={setFilterModule}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Modules" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Modules</SelectItem>
                                <SelectItem value="KYC">KYC Only</SelectItem>
                                <SelectItem value="PROPERTY">Properties Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-24">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-16">
                                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                                <h3 className="text-lg font-medium text-muted-foreground">No logs found</h3>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Date & Time</TableHead>
                                        <TableHead>Module</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Regulator</TableHead>
                                        <TableHead>Details / Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.log_id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getModuleBadge(log.module)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.targetName || `ID: ${log.targetId}`}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span className={`font-semibold ${
                                                        log.action === 'APPROVED' ? 'text-verified' : 
                                                        log.action === 'REJECTED' ? 'text-destructive' : ''
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {log.user?.name || 'System'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={log.details?.remarks || log.details?.reason || log.details?.comments || '-'}>
                                                {log.details?.remarks || log.details?.reason || log.details?.comments || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}