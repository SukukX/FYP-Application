"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const { setUser } = useAuth();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify-email?token=${token}`);
                setStatus("success");
                setMessage(res.data.message || "Your email has been verified!");
                
                // CRITICAL: Refresh the user profile in AuthContext so the dashboard knows they are verified
                api.get("/users/profile")
                   .then(profileRes => {
                       if (profileRes.data) setUser(profileRes.data);
                   })
                   .catch(() => {
                       // Ignore errors if they aren't logged in on this browser
                   });

            } catch (error: any) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Verification failed. The link may have expired.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-10"
            >
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Shield className="h-8 w-8 text-accent" />
                        <span className="text-2xl font-bold text-primary">Smart Sukuk</span>
                    </div>

                    <div className="mb-6 flex justify-center w-full">
                        {status === "loading" && (
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                        )}
                        {status === "success" && (
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </motion.div>
                        )}
                        {status === "error" && (
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center"
                            >
                                <XCircle className="h-8 w-8 text-red-500" />
                            </motion.div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-3">
                        {status === "loading" ? "Verifying Email..." : status === "success" ? "Verification Success" : "Verification Failed"}
                    </h2>
                    
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="space-y-3 w-full">
                        {status === "success" ? (
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl font-semibold transition-all" asChild>
                                <Link href="/dashboard">
                                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : status === "error" ? (
                            <>
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl font-semibold transition-all" asChild>
                                    <Link href="/auth/login">Back to Login</Link>
                                </Button>
                                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground py-6 rounded-xl transition-all">
                                    Resend verification email
                                </Button>
                            </>
                        ) : null}
                    </div>
                </div>
            </motion.div>

            <div className="mt-8 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; 2026 Smart Sukuk. All rights reserved.
                </p>
            </div>
        </div>
    );
}
