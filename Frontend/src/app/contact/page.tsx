"use client";

import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { complianceContacts } from "@/lib/mockData";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Message Sent",
            description: "Thank you for contacting us. We'll respond within 24 hours.",
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-bold text-primary mb-2 animate-fade-in">Contact Us</h1>
                    <p className="text-muted-foreground mb-8">Get in touch with our team for support, inquiries, or partnership opportunities.</p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <Card className="animate-slide-up">
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Full Name</label>
                                        <Input placeholder="Enter your name" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Email Address</label>
                                        <Input type="email" placeholder="your.email@example.com" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Phone Number</label>
                                        <Input type="tel" placeholder="+92 300 0000000" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Message</label>
                                        <Textarea placeholder="How can we help you?" rows={5} required />
                                    </div>
                                    <Button type="submit" className="w-full">Send Message</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                                <CardHeader>
                                    <CardTitle>Headquarters</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Smart Sukuk Technologies</p>
                                            <p className="text-sm text-muted-foreground">F-7 Markaz, Blue Area</p>
                                            <p className="text-sm text-muted-foreground">Islamabad, Pakistan</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground" />
                                        <a href="tel:+923000000000" className="hover:text-primary">+92 300 0000000</a>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <a href="mailto:info@smartsukuk.com" className="hover:text-primary">info@smartsukuk.com</a>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                                <CardHeader>
                                    <CardTitle>Team Contacts</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {complianceContacts.map((contact, idx) => (
                                        <div key={idx} className="pb-4 border-b last:border-0 last:pb-0">
                                            <h3 className="font-semibold mb-1">{contact.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-2">{contact.role}</p>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                                                <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
