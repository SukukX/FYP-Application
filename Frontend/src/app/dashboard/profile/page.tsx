"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Loader2, Camera, Shield, Wallet, User, Lock, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Profile Form Data
    const [formData, setFormData] = useState({
        name: "",
        phone_number: "",
        country: "",
        address: "",
        dob: "",
        profile_pic: "",
    });

    // Avatar URL State
    const [avatarUrl, setAvatarUrl] = useState("");

    // Password Change State
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Wallet State
    const [isWalletLoading, setIsWalletLoading] = useState(false);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
    const [walletAddressInput, setWalletAddressInput] = useState("");

    // MFA State
    const [isMfaLoading, setIsMfaLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                phone_number: user.phone_number || "",
                country: user.country || "",
                address: user.address || "",
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
                profile_pic: user.profile_pic || "",
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const res = await api.patch("/users/profile", formData);
            setUser({ ...user, ...res.data }); // Update context
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profile_pic", file);

        try {
            setIsLoading(true);
            const res = await api.post("/users/profile/avatar", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setFormData(prev => ({ ...prev, profile_pic: res.data.profile_pic }));
            if (user) {
                setUser({ ...user, profile_pic: res.data.profile_pic });
            }

            toast({
                title: "Avatar Updated",
                description: "Your profile picture has been updated successfully.",
            });
        } catch (error: any) {
            console.error("Upload Error:", error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload profile picture. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUrlSave = async () => {
        if (!avatarUrl) return;

        // Basic validation for image URL
        const isValidImage = (url: string) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
        };

        setIsLoading(true);
        try {
            const valid = await isValidImage(avatarUrl);
            if (!valid) {
                toast({
                    title: "Invalid Image URL",
                    description: "The URL provided does not point to a valid image. Please check the link.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }
            // We use the same update profile endpoint but just for the picture logic
            // Since there isn't a dedicated "url avatar" endpoint, we can use the generic profile update
            // OR create one. Using generic update for simplicity as it handles profile_pic string.

            // However, to mimic "upload" behavior (immediate save), we call the patch endpoint.
            const res = await api.patch("/users/profile", { profile_pic: avatarUrl });

            setFormData(prev => ({ ...prev, profile_pic: avatarUrl }));
            if (user) {
                setUser({ ...user, profile_pic: avatarUrl });
            }

            toast({
                title: "Avatar Updated",
                description: "Your profile picture has been updated successfully.",
            });
            setAvatarUrl("");
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Failed to update profile picture",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Password Change Logic ---
    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Passwords do not match",
                description: "New password and confirmation must match.",
                variant: "destructive",
            });
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put("/users/password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully.",
            });
            setIsPasswordDialogOpen(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    // --- Wallet Logic ---
    const handleConnectWallet = async () => {
        if (!walletAddressInput) return;

        setIsWalletLoading(true);
        try {
            // Send to backend
            const res = await api.post("/users/wallet", { walletAddress: walletAddressInput });

            // Update user context manually
            const updatedUser = { ...user } as any;
            if (!updatedUser.wallets) updatedUser.wallets = [];

            // Check if already exists locally
            const exists = updatedUser.wallets.find((w: any) => w.wallet_address === walletAddressInput);
            if (!exists) {
                updatedUser.wallets.push({ wallet_address: walletAddressInput, is_primary: true });
            }

            setUser(updatedUser);

            toast({
                title: "Wallet Connected",
                description: `Connected to ${walletAddressInput}`,
            });
            setIsWalletDialogOpen(false);
            setWalletAddressInput("");
        } catch (error: any) {
            console.error("Wallet Connect Error:", error);
            toast({
                title: "Connection Failed",
                description: error.response?.data?.message || error.message || "Failed to connect wallet",
                variant: "destructive",
            });
        } finally {
            setIsWalletLoading(false);
        }
    };

    const handleDisconnectWallet = async () => {
        // Need the address to disconnect.
        const address = (user as any).wallets?.[0]?.wallet_address;
        if (!address) return;

        setIsWalletLoading(true);
        try {
            await api.delete(`/users/wallet/${address}`);

            // Update context
            const updatedUser = { ...user } as any;
            updatedUser.wallets = updatedUser.wallets.filter((w: any) => w.wallet_address !== address);
            setUser(updatedUser);

            toast({
                title: "Wallet Disconnected",
                description: "Your wallet has been disconnected.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to disconnect wallet",
                variant: "destructive",
            });
        } finally {
            setIsWalletLoading(false);
        }
    };

    // --- MFA Logic ---
    const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
    const [mfaStep, setMfaStep] = useState<'intro' | 'qr' | 'success'>('intro');
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [mfaSecret, setMfaSecret] = useState("");
    const [mfaToken, setMfaToken] = useState("");

    const handleStartMfaSetup = async () => {
        setIsMfaLoading(true);
        try {
            const res = await api.post("/users/mfa/setup");
            setQrCodeUrl(res.data.qrCodeUrl);
            setMfaSecret(res.data.secret);
            setMfaStep('qr');
            setIsMfaSetupOpen(true);
        } catch (error: any) {
            toast({
                title: "Setup Failed",
                description: error.response?.data?.message || "Failed to start MFA setup",
                variant: "destructive",
            });
        } finally {
            setIsMfaLoading(false);
        }
    };

    const handleVerifyMfa = async () => {
        setIsMfaLoading(true);
        try {
            await api.post("/users/mfa/verify", { token: mfaToken });

            // Success
            setMfaStep('success');

            // Update User Context
            const updatedUser = { ...user } as any;
            if (!updatedUser.mfa_setting) updatedUser.mfa_setting = {};
            updatedUser.mfa_setting.is_enabled = true;
            setUser(updatedUser);

            toast({
                title: "MFA Enabled",
                description: "Two-Factor Authentication is now active.",
            });

            // Close after brief delay
            setTimeout(() => {
                setIsMfaSetupOpen(false);
                setMfaStep('intro');
                setMfaToken("");
            }, 2000);

        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.response?.data?.message || "Invalid code. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsMfaLoading(false);
        }
    };

    const handleToggleMFA = async (isEnabled: boolean) => {
        if (isEnabled) {
            // Start Setup Flow
            handleStartMfaSetup();
        } else {
            // Disable Flow
            setIsMfaLoading(true);
            try {
                await api.put("/users/mfa", { isEnabled: false });

                const updatedUser = { ...user } as any;
                if (updatedUser.mfa_setting) updatedUser.mfa_setting.is_enabled = false;
                setUser(updatedUser);

                toast({
                    title: "MFA Disabled",
                    description: "Two-Factor Authentication has been turned off.",
                });
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to disable MFA",
                    variant: "destructive",
                });
            } finally {
                setIsMfaLoading(false);
            }
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const connectedWallet = (user as any).wallets?.[0]?.wallet_address;

    return (
        <div className="min-h-screen bg-background pb-8">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-primary mb-2">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your profile, security, and preferences.</p>
                </div>

                <div className="grid gap-6">
                    {/* Header Section */}
                    <Card className="animate-slide-up">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={formData.profile_pic} />
                                        <AvatarFallback className="text-2xl">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Label
                                        htmlFor="avatar-upload"
                                        className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors z-10"
                                        title="Upload Image"
                                    >
                                        <Camera className="h-4 w-4" />
                                        <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    </Label>
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1 flex-wrap">
                                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                                        <Badge className={user.kyc_request?.status === 'approved' ? 'bg-verified' : user.kyc_request?.status === 'rejected' ? 'bg-destructive' : 'bg-pending'}>
                                            {user.kyc_request?.status === 'approved' ? 'Verified Investor' : user.kyc_request?.status === 'rejected' ? 'KYC Rejected' : 'KYC Pending'}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-center md:justify-start gap-2 max-w-md">
                                        <Input
                                            placeholder="https://example.com/image.png"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Button size="sm" onClick={handleAvatarUrlSave} disabled={!avatarUrl || isLoading}>
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="personal" className="w-full animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 h-auto">
                            <TabsTrigger value="personal">Personal Info</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="kyc">Verification</TabsTrigger>
                            <TabsTrigger value="wallet">Wallet</TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" value={formData.name} onChange={handleInputChange} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="dob">Date of Birth</Label>
                                            <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone_number">Phone Number</Label>
                                            <Input id="phone_number" value={formData.phone_number} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={formData.country} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" value={formData.address} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage your account security and authentication methods.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="flex gap-2">
                                            <Input id="email" value={user.email} disabled className="bg-muted" />
                                            <Badge variant="outline" className="h-10 px-3 flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> Read-only
                                            </Badge>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="font-medium">Password</h3>
                                            <p className="text-sm text-muted-foreground">Change your account password.</p>
                                        </div>
                                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline">Change Password</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Change Password</DialogTitle>
                                                    <DialogDescription>
                                                        Enter your current password and a new password below.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="current-password">Current Password</Label>
                                                        <Input
                                                            id="current-password"
                                                            type="password"
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="new-password">New Password</Label>
                                                        <Input
                                                            id="new-password"
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                                        <Input
                                                            id="confirm-password"
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                                                    <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                                                        {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Update Password
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="font-medium">Two-Factor Authentication</h3>
                                            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isMfaLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            <Switch
                                                checked={(user as any).mfa_setting?.is_enabled || false}
                                                onCheckedChange={handleToggleMFA}
                                                disabled={isMfaLoading}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {(user as any).mfa_setting?.is_enabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>

                                        {/* MFA Setup Dialog */}
                                        <Dialog open={isMfaSetupOpen} onOpenChange={(open) => {
                                            if (!open) setMfaStep('intro'); // Reset on close
                                            setIsMfaSetupOpen(open);
                                        }}>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                                                    <DialogDescription>
                                                        Secure your account with TOTP (Time-based One-Time Password).
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="py-4">
                                                    {mfaStep === 'qr' && (
                                                        <div className="flex flex-col items-center space-y-4">
                                                            <div className="bg-white p-2 rounded-lg">
                                                                {qrCodeUrl ? (
                                                                    <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                                                                ) : (
                                                                    <Loader2 className="h-24 w-24 animate-spin text-muted" />
                                                                )}
                                                            </div>
                                                            <div className="text-center space-y-2">
                                                                <p className="text-sm text-muted-foreground">
                                                                    Scan this QR code with your Authenticator App (Google Authenticator, Authy, etc.).
                                                                </p>
                                                                <p className="text-xs text-muted-foreground break-all">
                                                                    Secret: <span className="font-mono bg-muted px-1 rounded">{mfaSecret}</span>
                                                                </p>
                                                            </div>
                                                            <div className="w-full space-y-2">
                                                                <Label htmlFor="mfa-token">Enter 6-digit Code</Label>
                                                                <Input
                                                                    id="mfa-token"
                                                                    placeholder="000000"
                                                                    value={mfaToken}
                                                                    maxLength={6}
                                                                    onChange={(e) => setMfaToken(e.target.value)}
                                                                    className="text-center font-mono text-lg tracking-widest"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {mfaStep === 'success' && (
                                                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                                                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                                                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-semibold">MFA Enabled!</h3>
                                                                <p className="text-muted-foreground">Your account is now more secure.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <DialogFooter>
                                                    {mfaStep === 'qr' && (
                                                        <Button onClick={handleVerifyMfa} disabled={isMfaLoading || mfaToken.length !== 6}>
                                                            {isMfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Verify & Enable
                                                        </Button>
                                                    )}
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        {/* ... rest of tabs ... */}

                        <TabsContent value="kyc">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identity Verification (KYC)</CardTitle>
                                    <CardDescription>Status of your identity verification.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-accent/5">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${user.kyc_request?.status === 'approved' ? 'bg-verified text-white' : user.kyc_request?.status === 'rejected' ? 'bg-destructive text-white' : 'bg-pending text-white'}`}>
                                            <Shield className="h-6 w-6" />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h3 className="font-semibold text-lg capitalize">{user.kyc_request?.status || 'Not Submitted'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {user.kyc_request?.status === 'approved'
                                                    ? "Your identity has been verified. You have full access to investing."
                                                    : "Please verify your identity to unlock investment features."}
                                            </p>
                                        </div>
                                    </div>

                                    {user.kyc_request?.status !== 'approved' && (
                                        <Button className="w-full" variant="default" onClick={() => router.push('/dashboard/investor')}>
                                            Go to Dashboard to Submit KYC
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="wallet">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Wallet Management</CardTitle>
                                    <CardDescription>Manage your connected cryptocurrency wallet.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-accent/5">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Wallet className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 overflow-hidden text-center md:text-left w-full">
                                            <h3 className="font-semibold text-lg">Connected Wallet</h3>
                                            <p className="text-sm text-muted-foreground break-all">
                                                {connectedWallet || "No wallet connected"}
                                            </p>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            {connectedWallet ? (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="w-full md:w-auto"
                                                    onClick={handleDisconnectWallet}
                                                    disabled={isWalletLoading}
                                                >
                                                    {isWalletLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    Disconnect
                                                </Button>
                                            ) : (
                                                <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full md:w-auto"
                                                        >
                                                            <Wallet className="h-4 w-4 mr-2" />
                                                            Connect Wallet
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Connect Wallet</DialogTitle>
                                                            <DialogDescription>
                                                                Enter your wallet address manually.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="wallet-address">Wallet Address</Label>
                                                                <Input
                                                                    id="wallet-address"
                                                                    placeholder="0x..."
                                                                    value={walletAddressInput}
                                                                    onChange={(e) => setWalletAddressInput(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>Cancel</Button>
                                                            <Button onClick={handleConnectWallet} disabled={isWalletLoading || !walletAddressInput}>
                                                                {isWalletLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Connect
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium">Wallet Features</h4>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            <li>Receive dividend payouts directly to your wallet.</li>
                                            <li>Securely sign transactions on the blockchain.</li>
                                            <li>Prove ownership of your tokenized assets.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
