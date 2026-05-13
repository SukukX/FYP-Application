"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.post("/auth/forgot-password", { email });
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-border shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-accent via-primary to-accent" />
                    <CardHeader className="space-y-1 pb-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password?</CardTitle>
                        <CardDescription className="text-muted-foreground text-base">
                            Enter your email and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubmitted ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-4"
                            >
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Check your email</h3>
                                <p className="text-muted-foreground">
                                    If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive a password reset link shortly.
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Address</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 rounded-xl border-border bg-muted/30 focus:bg-background transition-all"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
                        <Link 
                            href="/auth/login" 
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
