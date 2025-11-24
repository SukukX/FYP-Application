import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Shield, Lock, TrendingUp, FileCheck, Building2, Users } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="container relative z-10 mx-auto">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              Powered by ERC-1400 Security Tokens
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">
              Smart Sukuk
            </h1>
            <p className="text-xl md:text-2xl text-primary/80 mb-4 font-semibold">
              Tokenizing Real Estate
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform property ownership with blockchain-backed security tokens. Compliant, transparent, and accessible real estate investment for the modern era.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace">
                <Button size="lg" className="text-lg px-8">
                  Explore Marketplace
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="text-lg px-8 border-2">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Built on Trust & Compliance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every transaction is verified, every document is audited, and every investor is protected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg animate-slide-up">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Regulator Verified</h3>
                <p className="text-muted-foreground">
                  All properties and investors undergo rigorous KYC verification by authorized regulators before trading.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Blockchain Security</h3>
                <p className="text-muted-foreground">
                  ERC-1400 compliant smart contracts ensure transparent, immutable ownership records on the blockchain.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">Fractional Ownership</h3>
                <p className="text-muted-foreground">
                  Invest in premium real estate with any amount. Buy and sell tokens representing property shares.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How Smart Sukuk Works
            </h2>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  <h3 className="text-xl font-semibold text-primary">Property Tokenization</h3>
                </div>
                <p className="text-muted-foreground">
                  Property owners submit their real estate for tokenization, uploading legal documents and valuation reports. Each property is divided into security tokens.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-5 w-5 text-accent" />
                  <h3 className="text-xl font-semibold text-primary">Regulator Verification</h3>
                </div>
                <p className="text-muted-foreground">
                  Authorized regulators verify KYC documents and property authenticity. Only approved listings go live on the marketplace.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-accent" />
                  <h3 className="text-xl font-semibold text-primary">Trade & Invest</h3>
                </div>
                <p className="text-muted-foreground">
                  Verified investors buy and sell security tokens on the open marketplace, with full transparency and blockchain-backed ownership records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Real Estate Investment?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join Smart Sukuk today and experience compliant, transparent tokenized real estate.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-secondary/20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-accent" />
                <span className="font-bold text-primary">Smart Sukuk</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tokenizing real estate with blockchain technology and regulatory compliance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/marketplace" className="text-muted-foreground hover:text-accent transition-colors">Marketplace</Link></li>
                <li><Link href="/auth/register" className="text-muted-foreground hover:text-accent transition-colors">Register</Link></li>
                <li><Link href="/auth/login" className="text-muted-foreground hover:text-accent transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/compliance" className="text-muted-foreground hover:text-accent transition-colors">Compliance Rules</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-accent transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-muted-foreground hover:text-accent transition-colors">Contact Us</Link></li>
                <li className="text-muted-foreground">support@smartsukuk.com</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Smart Sukuk. All rights reserved. Regulated financial platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
