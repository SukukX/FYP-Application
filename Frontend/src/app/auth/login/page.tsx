"use client";
/**
 * [PAGE] Login
 * ------------
 * Purpose: Authenticates users and redirects them based on their role.
 * Connections:
 * - API: POST /api/auth/login
 * - State: Updates global AuthContext (user + token).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";



export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mfaCode, setMfaCode] = useState(""); // New State
    const [showMfaInput, setShowMfaInput] = useState(false); // New State

    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    /**
     * [ACTION] Handle Login
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Include mfaCode if we are in the second step
            const payload = { email, password, mfaCode: showMfaInput ? mfaCode : undefined };

            const res = await api.post("/auth/login", payload);

            if (res.data.mfaRequired) {
                setShowMfaInput(true);
                toast({
                    title: "MFA Required",
                    description: "Please enter the code from your authenticator app.",
                });
                setIsLoading(false);
                return;
            }

            const { token, user } = res.data;

            login(token, user);

            toast({
                title: "Login Successful",
                description: `Welcome back, ${user.name}!`,
            });

        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.response?.data?.message || "Invalid credentials",
                variant: "destructive",
            });
            // If failed during MFA, maybe clear the code
            if (showMfaInput) setMfaCode("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-16 flex items-center justify-center">
                <Card className="w-full max-w-md animate-scale-in">
                    <CardHeader>
                        <CardTitle className="text-2xl">Login to Smart Sukuk</CardTitle>
                        <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!showMfaInput ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email or Username *</Label>
                                        <Input
                                            id="email"
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="h-11"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="password">Password *</Label>
                                            <Link href="/auth/forgot" className="text-xs text-accent hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="h-11"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 animate-fade-in">
                                    <Label htmlFor="mfaCode">Authenticator Code</Label>
                                    <Input
                                        id="mfaCode"
                                        type="text"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="h-11 text-center text-lg tracking-widest font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-xs text-muted-foreground"
                                        onClick={() => { setShowMfaInput(false); setMfaCode(""); }}
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                                {isLoading ? "Verifying..." : (showMfaInput ? "Verify Code" : "Login")}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link href="/auth/register" className="text-accent hover:underline font-medium">
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
