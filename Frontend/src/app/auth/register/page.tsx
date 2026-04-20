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

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Users, Shield, Camera, Upload, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Webcam from "react-webcam";

type UserRole = "user" | "regulator";

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
    
    // Regulator-specific file state
    const [cnicFront, setCnicFront] = useState<File | null>(null);
    const [cnicBack, setCnicBack] = useState<File | null>(null);
    const [faceScan, setFaceScan] = useState<File | null>(null);
    const [scanning, setScanning] = useState<"front" | "back" | "face" | null>(null);
    
    const router = useRouter();
    const { toast } = useToast();
    const webcamRef = useRef<Webcam>(null);

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
    };

    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const capture = useCallback(async (mode: "front" | "back" | "face") => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `${mode}_scan.jpg`, { type: "image/jpeg" });

        if (mode === "front") setCnicFront(file);
        else if (mode === "back") setCnicBack(file);
        else if (mode === "face") setFaceScan(file);
        
        setScanning(null);
    }, [webcamRef]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!selectedRole) {
            toast({ title: "Role Required", description: "Please select your account type", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        // Regulator validation
        if (selectedRole === "regulator" && (!cnicFront || !cnicBack)) {
            toast({ title: "Documents Required", description: "Please provide CNIC front and back images", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("password", formData.password);
            data.append("role", selectedRole);
            data.append("phone_number", formData.phone_number);
            data.append("cnic", formData.cnic);
            data.append("dob", formData.dob);
            
            if (cnicFront) data.append("cnic_front", cnicFront);
            if (cnicBack) data.append("cnic_back", cnicBack);
            if (faceScan) data.append("face_scan", faceScan);

            const res = await api.post("/auth/register", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            const { token, user } = res.data;
            login(token, user);

            toast({
                title: "Account Created",
                description: selectedRole === 'regulator' 
                    ? "Your account is created and awaiting admin approval."
                    : "Your account has been created successfully.",
            });
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

    const DocField = ({ label, mode, currentFile, setFile }: any) => (
        <div className="space-y-2">
            <Label>{label}{mode === "face" ? " (Optional)" : " *"}</Label>
            {currentFile && (
                <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
                    <Check className="h-3 w-3" /> {currentFile.name} selected
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => setFile(null)}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setScanning(mode)}>
                    <Camera className="mr-2 h-4 w-4" /> Scan
                </Button>
                <div className="relative flex-1">
                    <Input
                        type="file"
                        accept="image/*"
                        className="opacity-0 absolute inset-0 cursor-pointer"
                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    />
                    <Button type="button" variant="secondary" className="w-full pointer-events-none">
                        <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                </div>
            </div>
        </div>
    );

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

                                {selectedRole === "regulator" && (
                                    <div className="pt-4 border-t space-y-4">
                                        <h3 className="font-semibold text-primary">Identity Documents</h3>
                                        {scanning ? (
                                            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                                                <Webcam
                                                    audio={false}
                                                    ref={webcamRef}
                                                    screenshotFormat="image/jpeg"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-4 flex justify-center gap-2 w-full">
                                                    <Button type="button" variant="destructive" size="sm" onClick={() => setScanning(null)}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="button" size="sm" onClick={() => capture(scanning)}>
                                                        Capture
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <DocField label="CNIC Front" mode="front" currentFile={cnicFront} setFile={setCnicFront} />
                                                <DocField label="CNIC Back" mode="back" currentFile={cnicBack} setFile={setCnicBack} />
                                                <DocField label="Face Scan" mode="face" currentFile={faceScan} setFile={setFaceScan} />
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
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

                                <Button type="submit" className="w-full" disabled={isLoading || !!scanning}>
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
