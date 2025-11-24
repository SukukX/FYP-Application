import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complianceContacts } from "@/lib/mockData";
import { Mail, Phone, Shield, CheckCircle } from "lucide-react";

export default function Compliance() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-primary mb-2 animate-fade-in">Compliance & Regulatory Framework</h1>
                    <p className="text-muted-foreground mb-8">Smart Sukuk operates under strict regulatory oversight to ensure investor protection and legal compliance.</p>

                    {/* KYC Requirements */}
                    <Card className="mb-8 animate-slide-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                KYC & NADRA Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">All users must complete KYC verification through NADRA (National Database and Registration Authority) before engaging in token transactions.</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">CNIC Verification</p>
                                        <p className="text-sm text-muted-foreground">Front and back images of valid Pakistani CNIC</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">Biometric Authentication</p>
                                        <p className="text-sm text-muted-foreground">Fingerprint verification through authorized channels</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">Live Selfie Verification</p>
                                        <p className="text-sm text-muted-foreground">Real-time photo verification to prevent fraud</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* FBR Requirements */}
                    <Card className="mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                FBR Compliance & Property Documentation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">All property listings must be verified and approved by the Federal Board of Revenue (FBR) regulatory node before becoming active.</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">Property Title Verification</p>
                                        <p className="text-sm text-muted-foreground">Legal ownership documentation and title deed verification</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">Valuation Report</p>
                                        <p className="text-sm text-muted-foreground">Independent valuation by certified assessors</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">Tax Compliance</p>
                                        <p className="text-sm text-muted-foreground">Property tax clearance and financial audit trail</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-verified mt-0.5" />
                                    <div>
                                        <p className="font-medium">ERC-1400 Smart Contract Audit</p>
                                        <p className="text-sm text-muted-foreground">Security token compliance and smart contract verification</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance Team Contacts */}
                    <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                        <CardHeader>
                            <CardTitle>Compliance Team</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {complianceContacts.map((contact, idx) => (
                                <div key={idx} className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg mb-1">{contact.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{contact.role}</p>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
