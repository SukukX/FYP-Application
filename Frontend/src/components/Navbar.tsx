"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { storage } from "@/lib/mockData";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(storage.getUser());
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold text-primary">Smart Sukuk</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/marketplace" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Marketplace
          </Link>
          <Link href="/compliance" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Compliance
          </Link>
          <Link href="/terms" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <UserAvatar user={currentUser} />
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
