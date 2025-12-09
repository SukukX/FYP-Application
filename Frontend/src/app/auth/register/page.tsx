"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Building2, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type UserRole = "investor" | "owner" | "regulator";

export default function Register() {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone_number: "",
        dob: "",
        cnic: "",
    });
    const router = useRouter();
    const { toast } = useToast();

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
    };

    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Client-side validation
        if (!selectedRole) {
            toast({
                title: "Role Required",
                description: "Please select your account type",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.post("/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: selectedRole,
                phone_number: formData.phone_number,
                cnic: formData.cnic,
            });
            const { token, user } = res.data;

            login(token, user);

            toast({
                title: "Account Created",
                description: "Your account has been created successfully.",
            });

            // Redirect is handled by AuthContext
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedRole) {
        return (
            <div className="min-h-screen grid lg:grid-cols-2">
                {/* Left: Hero Section */}
                <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&h=900&fit=crop')] bg-cover bg-center opacity-20" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-2xl font-bold">
                            <Link href="/">Smart Sukuk</Link>
                        </div>
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            Start Your Investment Journey
                        </h1>
                        <p className="text-lg opacity-90">
                            Create an account to access exclusive real estate opportunities or list your property for tokenization.
                        </p>
                    </div>
                    <div className="relative z-10 text-sm opacity-70">
                        &copy; 2025 Smart Sukuk. All rights reserved.
                    </div>
                </div>

                {/* Right: Role Selection */}
                <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
                    <div className="w-full max-w-2xl space-y-8 animate-fade-in">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Create an Account</h2>
                            <p className="text-muted-foreground">Select how you want to use Smart Sukuk</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up group"
                                onClick={() => handleRoleSelect("investor")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent group-hover:text-white transition-colors">
                                        <User className="h-6 w-6 text-accent group-hover:text-white" />
                                    </div>
                                    <CardTitle className="text-lg">Investor</CardTitle>
                                    <CardDescription>Buy & trade tokens</CardDescription>
                                </CardHeader>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up group"
                                style={{ animationDelay: "100ms" }}
                                onClick={() => handleRoleSelect("owner")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent group-hover:text-white transition-colors">
                                        <Building2 className="h-6 w-6 text-accent group-hover:text-white" />
                                    </div>
                                    <CardTitle className="text-lg">Property Owner</CardTitle>
                                    <CardDescription>Tokenize real estate</CardDescription>
                                </CardHeader>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up group md:col-span-2"
                                style={{ animationDelay: "200ms" }}
                                onClick={() => handleRoleSelect("regulator")}
                            >
                                <CardHeader className="text-center pb-4 flex flex-row items-center justify-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                                        <Shield className="h-5 w-5 text-accent group-hover:text-white" />
                                    </div>
                                    <div className="text-left">
                                        <CardTitle className="text-lg">Regulator</CardTitle>
                                        <CardDescription>Compliance & Verification</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </div>

                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-accent hover:underline font-semibold">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Hero Section (Same as above to maintain consistency) */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&h=900&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                        <Link href="/">Smart Sukuk</Link>
                    </div>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Join as {selectedRole === "investor" ? "an Investor" : selectedRole === "owner" ? "a Property Owner" : "a Regulator"}
                    </h1>
                    <p className="text-lg opacity-90">
                        {selectedRole === "investor" && "Start building your diversified real estate portfolio today."}
                        {selectedRole === "owner" && "Unlock the value of your property through fractional ownership."}
                        {selectedRole === "regulator" && "Ensure compliance and build trust in the digital asset ecosystem."}
                    </p>
                </div>
                <div className="relative z-10 text-sm opacity-70">
                    &copy; 2025 Smart Sukuk. All rights reserved.
                </div>
            </div>

            {/* Right: Registration Form */}
            <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
                <div className="w-full max-w-lg space-y-6 animate-fade-in py-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold tracking-tight">Sign Up</h2>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRole(null)} className="text-muted-foreground">
                            Change Role
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone_number">Phone</Label>
                                <Input
                                    id="phone_number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    placeholder="+92..."
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnic">CNIC</Label>
                                <Input
                                    id="cnic"
                                    placeholder="42101-..."
                                    value={formData.cnic}
                                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                    required
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                className="h-10"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base font-semibold mt-2" disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>

                    <div className="text-center text-sm pt-4">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-accent hover:underline font-semibold">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
