"use client";
/**
 * [PAGE] Register
 * ---------------
 * Purpose: New User Onboarding.
 * Features:
 * - Role Selection (User, Regulator).
 * - Registration Form (Conditional on Role - currently shared).
 * - API Integration (POST /api/auth/register).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Users, Shield, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { registerSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

type UserRole = "user" | "regulator";

export default function Register() {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [success, setSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone_number: "",
            dob: "",
            cnic: "",
            role: "user" as UserRole,
        },
    });

    const password = watch("password", "");

    const formatCNIC = (value: string) => {
        const numbers = value.replace(/[^\d]/g, "");
        if (numbers.length <= 5) return numbers;
        if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
    };

    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCNIC(e.target.value);
        setValue("cnic", formatted, { shouldValidate: true });
    };

    const passwordRequirements = [
        { label: "At least 8 characters", regex: /.{8,}/ },
        { label: "At least one uppercase letter", regex: /[A-Z]/ },
        { label: "At least one lowercase letter", regex: /[a-z]/ },
        { label: "At least one number", regex: /[0-9]/ },
        { label: "At least one special character", regex: /[^A-Za-z0-9]/ },
    ];

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
    };

    const onSubmit = async (values: any) => {
        setIsLoading(true);
        setFormError(null);

        try {
            const data = new FormData();
            data.append("name", values.name);
            data.append("email", values.email);
            data.append("password", values.password);
            data.append("role", selectedRole!);
            data.append("phone_number", values.phone_number || "");
            data.append("cnic", values.cnic);
            data.append("dob", values.dob);

            const res = await api.post("/auth/register", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast({
                title: "Account Created",
                description: selectedRole === 'regulator' 
                    ? "Your account is awaiting approval. Redirecting..." 
                    : "Welcome to Smart Sukuk! Redirecting...",
                className: "bg-primary text-primary-foreground border-none",
                duration: 3000,
            });
            const { token, user } = res.data;
            login(token, user);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "Registration failed. Please check your details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) return null;

    if (!selectedRole) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12 animate-fade-in">
                            <h1 className="text-4xl font-bold text-primary mb-4">Create Your Account</h1>
                            <p className="text-muted-foreground text-lg">Select your account type to get started</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up"
                                onClick={() => handleRoleSelect("user")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                                        <Users className="h-8 w-8 text-accent" />
                                    </div>
                                    <CardTitle className="text-xl">Investor / Property Owner</CardTitle>
                                    <CardDescription>Join the real estate ecosystem</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• Tokenize and list your properties</li>
                                        <li>• Purchase property tokens & earn yields</li>
                                        <li>• Trade properties on the secondary market</li>
                                        <li>• Access a unified portfolio dashboard</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: "100ms" }}
                                onClick={() => handleRoleSelect("regulator")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                                        <Shield className="h-8 w-8 text-accent" />
                                    </div>
                                    <CardTitle className="text-xl">Regulator</CardTitle>
                                    <CardDescription>Verify and approve listings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• Verify KYC documents</li>
                                        <li>• Approve or reject listings</li>
                                        <li>• Manage compliance and limits</li>
                                        <li>• Access platform audit trails</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/auth/login" className="text-accent hover:underline font-medium">
                                    Login here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <Card className="animate-scale-in">
                        <CardHeader>
                            <CardTitle className="text-2xl">Register as {selectedRole === "user" ? "Investor / Property Owner" : "Regulator"}</CardTitle>
                            <CardDescription>Create your account to get started</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        {...register("name")}
                                        error={errors.name?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        placeholder="+92 300 1234567"
                                        {...register("phone_number")}
                                        error={errors.phone_number?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register("email")}
                                        error={errors.email?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth *</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        {...register("dob")}
                                        error={errors.dob?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cnic">CNIC (42101-1234567-1) *</Label>
                                    <Input
                                        id="cnic"
                                        placeholder="42101-1234567-1"
                                        {...register("cnic")}
                                        onChange={handleCnicChange}
                                        error={errors.cnic?.message}
                                        maxLength={15}
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...register("password")}
                                        error={errors.password?.message}
                                    />
                                    <div className="grid grid-cols-1 gap-1.5 mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Security Requirements</p>
                                        {passwordRequirements.map((req, idx) => {
                                            const isMet = req.regex.test(password);
                                            return (
                                                <div key={idx} className="flex items-center gap-2 transition-all duration-300">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${isMet ? "bg-verified scale-125 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30"}`} />
                                                    <span className={`text-[11px] leading-none transition-colors duration-300 ${isMet ? "text-verified font-medium" : "text-muted-foreground"}`}>
                                                        {req.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...register("confirmPassword")}
                                        error={errors.confirmPassword?.message}
                                    />
                                </div>

                                {formError && (
                                    <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                                        <AlertDescription>{formError}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Creating Account..." : "Create Account"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setSelectedRole(null)}
                                >
                                    Change Role
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
