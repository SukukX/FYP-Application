"use client";

import { useState } from "react";
import { Mail, Loader2, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";

export function EmailVerificationBlocker() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { logout } = useAuth();

    const handleResend = async () => {
        try {
            setIsLoading(true);
            const res = await api.post("/auth/resend-verification");
            toast({
                title: "Email Sent!",
                description: res.data.message || "A new verification link has been sent to your email.",
                variant: "default",
                className: "bg-green-500 text-white border-none",
            });
        } catch (error: any) {
            toast({
                title: "Failed to resend",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Shield className="h-8 w-8 text-accent" />
                        <span className="text-2xl font-bold text-primary">Smart Sukuk</span>
                    </div>

                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                        Verify Your Email
                    </h2>
                    
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        To secure your account and access the marketplace, please verify your email address. We sent a link to your inbox that expires in <span className="text-foreground font-semibold">5 minutes</span>.
                    </p>

                    <div className="space-y-3 w-full">
                        <Button 
                            onClick={handleResend} 
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl font-semibold transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>Resend Verification Link <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>

                        <Button 
                            variant="ghost" 
                            onClick={logout}
                            className="w-full text-muted-foreground hover:text-foreground py-6 rounded-xl"
                        >
                            Log Out
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
