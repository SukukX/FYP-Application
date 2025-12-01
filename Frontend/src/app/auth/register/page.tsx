"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
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
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12 animate-fade-in">
                            <h1 className="text-4xl font-bold text-primary mb-4">Create Your Account</h1>
                            <p className="text-muted-foreground text-lg">Select your account type to get started</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up"
                                onClick={() => handleRoleSelect("investor")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                                        <User className="h-8 w-8 text-accent" />
                                    </div>
                                    <CardTitle className="text-xl">Investor</CardTitle>
                                    <CardDescription>Buy and trade property tokens</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• Purchase security tokens</li>
                                        <li>• Build your portfolio</li>
                                        <li>• Trade on marketplace</li>
                                        <li>• Track investments</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: "100ms" }}
                                onClick={() => handleRoleSelect("owner")}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                                        <Building2 className="h-8 w-8 text-accent" />
                                    </div>
                                    <CardTitle className="text-xl">Property Owner</CardTitle>
                                    <CardDescription>Tokenize your real estate</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• List properties</li>
                                        <li>• Create token offerings</li>
                                        <li>• Manage listings</li>
                                        <li>• View sales analytics</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer border-2 hover:border-accent hover:shadow-lg transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: "200ms" }}
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
                                        <li>• Approve listings</li>
                                        <li>• Manage compliance</li>
                                        <li>• Audit trail access</li>
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
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto">
                    <Card className="animate-scale-in">
                        <CardHeader>
                            <CardTitle className="text-2xl">Register as {selectedRole === "investor" ? "Investor" : selectedRole === "owner" ? "Property Owner" : "Regulator"}</CardTitle>
                            <CardDescription>Create your account to get started</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="+92 300 1234567"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth *</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cnic">CNIC (42101-1234567-1) *</Label>
                                    <Input
                                        id="cnic"
                                        placeholder="42101-1234567-1"
                                        value={formData.cnic}
                                        onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Min 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

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

                            <div className="mt-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/auth/login" className="text-accent hover:underline font-medium">
                                        Login here
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
