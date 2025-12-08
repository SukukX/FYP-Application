"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function CreateListing() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        address: "",
        valuation: "",
        totalTokens: "",
        tokensForSale: "",
        pricePerToken: "",
        description: "",
    });

    const updateField = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.address || !formData.valuation) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in all basic information fields.",
                    variant: "destructive",
                });
                return false;
            }
        } else if (step === 2) {
            const tokens = parseInt(formData.totalTokens);
            const forSale = parseInt(formData.tokensForSale);
            if (!tokens || !forSale || !formData.pricePerToken) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in all token economics fields.",
                    variant: "destructive",
                });
                return false;
            }
            if (forSale > tokens) {
                toast({
                    title: "Validation Error",
                    description: "Tokens for sale cannot exceed total tokens.",
                    variant: "destructive",
                });
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<{ [key: string]: File[] }>({
        images: [],
        documents: []
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'documents') => {
        if (e.target.files) {
            setFiles(prev => ({
                ...prev,
                [type]: Array.from(e.target.files || [])
            }));
        }
    };

    const submitProperty = async (isDraft: boolean) => {
        setIsLoading(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('title', formData.title);
            formDataObj.append('address', formData.address); // Backend expects location
            formDataObj.append('location', formData.address);
            formDataObj.append('valuation', formData.valuation);
            formDataObj.append('description', formData.description);
            formDataObj.append('property_type', 'commercial'); // Default or add field

            // Token info (might be empty for draft)
            formDataObj.append('total_tokens', formData.totalTokens || '0');
            formDataObj.append('tokens_for_sale', formData.tokensForSale || '0');
            formDataObj.append('price_per_token', formData.pricePerToken || '0');

            formDataObj.append('isDraft', isDraft.toString());

            // Append files
            files.images.forEach(file => {
                formDataObj.append('images', file);
            });
            files.documents.forEach(file => {
                formDataObj.append('documents', file);
            });

            // We need to import api here or at top
            const { default: api } = await import('@/lib/api');

            await api.post('/properties', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: isDraft ? "Draft Saved" : "Listing Submitted",
                description: isDraft
                    ? "Your property draft has been saved."
                    : "Your property has been submitted for regulator verification.",
            });

            setTimeout(() => router.push("/dashboard/owner"), 1500);
        } catch (error: any) {
            console.error("Submission error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save property",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDraft = () => {
        // Minimal validation for draft
        if (!formData.title) {
            toast({
                title: "Title Required",
                description: "Please enter a property title to save as draft.",
                variant: "destructive",
            });
            return;
        }
        submitProperty(true);
    };

    const handleSubmit = () => {
        submitProperty(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => router.push("/dashboard/owner")} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-primary mb-6 animate-fade-in">Create New Listing</h1>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${s <= step ? "bg-primary text-primary-foreground border-primary" : "border-muted text-muted-foreground"
                                    }`}>
                                    {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                                </div>
                                {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${s < step ? "bg-primary" : "bg-muted"}`} />}
                            </div>
                        ))}
                    </div>

                    <Card className="animate-slide-up">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                {step === 1 && "Basic Information"}
                                {step === 2 && "Token Economics"}
                                {step === 3 && "Documents & Images"}
                                {step === 4 && "Review & Submit"}
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={handleSaveDraft} disabled={isLoading}>
                                Save Draft
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Property Title *</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., Premium Commercial Plaza"
                                            value={formData.title}
                                            onChange={(e) => updateField("title", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="address">Address *</Label>
                                        <Input
                                            id="address"
                                            placeholder="e.g., F-7 Markaz, Islamabad"
                                            value={formData.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="valuation">Property Valuation (PKR) *</Label>
                                        <Input
                                            id="valuation"
                                            type="number"
                                            placeholder="e.g., 50000000"
                                            value={formData.valuation}
                                            onChange={(e) => updateField("valuation", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe the property features..."
                                            value={formData.description}
                                            onChange={(e) => updateField("description", e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Token Economics */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="totalTokens">Total Token Supply *</Label>
                                        <Input
                                            id="totalTokens"
                                            type="number"
                                            placeholder="e.g., 1000"
                                            value={formData.totalTokens}
                                            onChange={(e) => updateField("totalTokens", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tokensForSale">Tokens for Sale *</Label>
                                        <Input
                                            id="tokensForSale"
                                            type="number"
                                            placeholder="e.g., 400"
                                            value={formData.tokensForSale}
                                            onChange={(e) => updateField("tokensForSale", e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formData.totalTokens && formData.tokensForSale &&
                                                `${((parseInt(formData.tokensForSale) / parseInt(formData.totalTokens)) * 100).toFixed(1)}% of total supply`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="pricePerToken">Price per Token (PKR) *</Label>
                                        <Input
                                            id="pricePerToken"
                                            type="number"
                                            placeholder="e.g., 50000"
                                            value={formData.pricePerToken}
                                            onChange={(e) => updateField("pricePerToken", e.target.value)}
                                        />
                                    </div>
                                    {formData.tokensForSale && formData.pricePerToken && (
                                        <div className="p-4 bg-accent/10 rounded-lg">
                                            <p className="text-sm font-medium">Total Fundraise Amount</p>
                                            <p className="text-2xl font-bold text-primary">
                                                PKR {(parseInt(formData.tokensForSale) * parseInt(formData.pricePerToken)).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Documents */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Property Images</Label>
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                            <p className="text-muted-foreground">Upload images (max 5MB each, jpg/png)</p>
                                            <Button variant="outline" className="mt-4">Choose Files</Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Legal Documents</Label>
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                            <p className="text-muted-foreground">Upload PDFs (max 20MB each)</p>
                                            <Button variant="outline" className="mt-4">Choose Files</Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Required: Property title, valuation report, ownership proof
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-accent/10 rounded-lg space-y-2">
                                        <h3 className="font-semibold text-lg">{formData.title}</h3>
                                        <p className="text-sm text-muted-foreground">{formData.address}</p>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Valuation</p>
                                                <p className="font-semibold">PKR {parseInt(formData.valuation).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Tokens</p>
                                                <p className="font-semibold">{formData.totalTokens}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">For Sale</p>
                                                <p className="font-semibold">{formData.tokensForSale}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Price/Token</p>
                                                <p className="font-semibold">PKR {parseInt(formData.pricePerToken).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-4 border rounded-lg">
                                        <input type="checkbox" className="mt-1" id="confirm" />
                                        <label htmlFor="confirm" className="text-sm">
                                            I confirm that all information and documents provided are accurate and complete. I understand that false information may result in listing rejection and legal consequences.
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between pt-6 border-t">
                                <div className="flex gap-2">
                                    {step > 1 && (
                                        <Button variant="outline" onClick={() => setStep(step - 1)}>
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Previous
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => { console.log("Save Draft clicked"); handleSaveDraft(); }} disabled={isLoading}>
                                        {isLoading ? "Saving..." : "Save Draft"}
                                    </Button>
                                </div>

                                {step < 4 ? (
                                    <Button onClick={handleNext}>
                                        Next
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={isLoading}>
                                        {isLoading ? "Submitting..." : "Submit for Approval"}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
