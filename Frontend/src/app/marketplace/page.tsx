"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, MapPin, TrendingUp, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { mockListings } from "@/lib/mockData";
import { Chatbot } from "@/components/Chatbot";

export default function Marketplace() {
    const [searchQuery, setSearchQuery] = useState("");
    const [propertyType, setPropertyType] = useState("all");
    const [priceRange, setPriceRange] = useState([0, 100000000]);
    const [tokenRange, setTokenRange] = useState([0, 2000]);
    const [sortBy, setSortBy] = useState("newest");

    const filteredListings = mockListings.filter((listing) => {
        const matchesSearch =
            listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice =
            listing.valuation >= priceRange[0] && listing.valuation <= priceRange[1];
        const matchesTokens =
            listing.totalTokens >= tokenRange[0] && listing.totalTokens <= tokenRange[1];

        return matchesSearch && matchesPrice && matchesTokens;
    });

    const sortedListings = [...filteredListings].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.pricePerToken - b.pricePerToken;
            case "price-high":
                return b.pricePerToken - a.pricePerToken;
            case "tokens":
                return b.tokensAvailable - a.tokensAvailable;
            default:
                return 0;
        }
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold text-primary mb-2">Property Marketplace</h1>
                    <p className="text-muted-foreground">Browse verified, tokenized real estate investments</p>
                </div>

                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <Input
                        placeholder="Search properties by location or title..."
                        className="flex-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {/* Filters Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Property Type</Label>
                                    <Select value={propertyType} onValueChange={setPropertyType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="residential">Residential</SelectItem>
                                            <SelectItem value="commercial">Commercial</SelectItem>
                                            <SelectItem value="industrial">Industrial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Price Range (PKR)</Label>
                                    <div className="pt-2">
                                        <Slider
                                            min={0}
                                            max={100000000}
                                            step={1000000}
                                            value={priceRange}
                                            onValueChange={setPriceRange}
                                        />
                                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                            <span>{(priceRange[0] / 1000000).toFixed(0)}M</span>
                                            <span>{(priceRange[1] / 1000000).toFixed(0)}M</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Token Availability</Label>
                                    <div className="pt-2">
                                        <Slider
                                            min={0}
                                            max={2000}
                                            step={100}
                                            value={tokenRange}
                                            onValueChange={setTokenRange}
                                        />
                                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                            <span>{tokenRange[0]}</span>
                                            <span>{tokenRange[1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Sort Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                            <div className="space-y-2">
                                <Label>Sort By</Label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest Listings</SelectItem>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        <SelectItem value="tokens">Token Availability</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {sortedListings.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No properties match your search criteria.</p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedListings.map((listing, index) => (
                            <Link key={listing.id} href={`/marketplace/${listing.id}`}>
                                <Card
                                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50 cursor-pointer animate-slide-up"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                        />
                                        <Badge className="absolute top-3 right-3 bg-verified text-verified-foreground">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    </div>

                                    <CardContent className="p-4">
                                        <h3 className="font-semibold text-lg text-primary mb-2 line-clamp-2">
                                            {listing.title}
                                        </h3>

                                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {listing.address}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Valuation</span>
                                                <span className="font-semibold text-primary">
                                                    PKR {(listing.valuation / 1000000).toFixed(1)}M
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Token Price</span>
                                                <span className="font-semibold text-accent">
                                                    PKR {(listing.pricePerToken / 1000).toFixed(0)}K
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Available</span>
                                                <span className="font-semibold flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3 text-verified" />
                                                    {listing.tokensAvailable} / {listing.totalTokens}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-4 pt-0">
                                        <Button className="w-full">
                                            View Details
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Chatbot />
        </div>
    );
}
