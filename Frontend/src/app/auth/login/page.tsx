"use client";
/**
 * [PAGE] Login
 * ------------
 * Purpose: Authenticates users and redirects them based on their role.
 * Connections:
 * - API: POST /api/auth/login
 * - State: Updates global AuthContext (user + token).
 */

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { loginSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

function LoginForm() {
    const [showMfaInput, setShowMfaInput] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const { login } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        const reason = searchParams.get("reason");
        if (reason === "unauthorized") {
            toast({
                title: "Authentication Required",
                description: "Please login to view that page.",
                variant: "destructive",
                duration: 5000, // Show longer
            });
            // Clean up URL
            window.history.replaceState({}, "", "/auth/login");
        }
    }, [searchParams, toast]);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onBlur",
        defaultValues: {
            email: "",
            password: "",
            mfaCode: "",
        },
    });

    const onSubmit = async (values: any) => {
        setIsLoading(true);
        // Only clear error if user clicks login again
        setFormError(null);

        try {
            const payload = {
                email: values.email,
                password: values.password,
                mfaCode: showMfaInput ? values.mfaCode : undefined
            };

            const res = await api.post("/auth/login", payload);

            if (res.data.mfaRequired) {
                setShowMfaInput(true);
                setIsLoading(false);
                return;
            }

            toast({
                title: "Login Successful",
                description: "Welcome back! Redirecting to your dashboard...",
                className: "bg-primary text-primary-foreground border-none",
                duration: 3000,
            });
            const { token, user } = res.data;
            login(token, user);

        } catch (error: any) {
            setFormError(error.response?.data?.message || "Invalid credentials. Please try again.");
            if (showMfaInput) setValue("mfaCode", "");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) return null;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-16 flex items-center justify-center">
                <Card className="w-full max-w-md animate-scale-in">
                    <CardHeader>
                        <CardTitle className="text-2xl">Login to Smart Sukuk</CardTitle>
                        <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {showMfaInput && (
                                <Alert className="border-accent bg-accent/5 animate-in fade-in duration-500">
                                    <ShieldAlert className="h-4 w-4 text-accent" />
                                    <AlertDescription className="text-xs">
                                        Two-Factor Authentication is enabled. Please enter the 6-digit code from your app.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {!showMfaInput ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register("email")}
                                            error={errors.email?.message}
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
                                            {...register("password")}
                                            error={errors.password?.message}
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
                                        {...register("mfaCode")}
                                        error={errors.mfaCode?.message}
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
                                        onClick={() => { setShowMfaInput(false); setValue("mfaCode", ""); }}
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                            )}

                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
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

export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
