"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Shared React Query hooks for data fetching with automatic caching.
 * These hooks ensure that navigating between pages (e.g., Dashboard → Portfolio)
 * does NOT trigger duplicate API calls — the data is cached for 30s (see providers.tsx).
 */

import { useAuth } from "@/context/auth-context";

// ─── Dashboard (User) ────────────────────────────────────────────
export function useDashboard(enabled: boolean = true) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["dashboard", "user", user?.user_id],
        queryFn: async () => {
            const res = await api.get("/dashboard/user");
            return res.data;
        },
        enabled: !!user && enabled,
    });
}

// ─── Marketplace Listings ────────────────────────────────────────
export function useMarketplaceListings() {
    return useQuery({
        queryKey: ["marketplace", "listings"],
        queryFn: async () => {
            const res = await api.get("/marketplace");
            return res.data;
        },
    });
}

// ─── Exchange Listings ───────────────────────────────────────────
export function useExchangeListings(enabled: boolean = true) {
    return useQuery({
        queryKey: ["exchange", "listings"],
        queryFn: async () => {
            const res = await api.get("/exchange/listings");
            return res.data;
        },
        enabled,
    });
}
