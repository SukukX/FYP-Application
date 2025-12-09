"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";



export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post("/auth/login", { email, password });
            const { token, user } = res.data;

            login(token, user);

            toast({
                title: "Login Successful",
                description: `Welcome back, ${user.name}!`,
            });

            // Redirect is handled by AuthContext, but we can ensure it here
            // router.push(`/dashboard/${user.role}`); 
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.response?.data?.message || "Invalid credentials",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Hero Section */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=900&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                        <Link href="/">Smart Sukuk</Link>
                    </div>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Tokenizing the Future of Real Estate
                    </h1>
                    <p className="text-lg opacity-90">
                        Join the world's most trusted platform for blockchain-backed property investments.
                        Secure, transparent, and compliant.
                    </p>
                </div>
                <div className="relative z-10 text-sm opacity-70">
                    &copy; 2025 Smart Sukuk. All rights reserved.
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8 animate-fade-in">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email or Username</Label>
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/auth/forgot" className="text-sm text-accent hover:underline font-medium">
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
                                className="h-12"
                                placeholder="Enter your password"
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="text-accent hover:underline font-semibold">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
