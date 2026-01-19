import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Camera, Upload, RefreshCw, Check, X } from "lucide-react";

interface KYCWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function KYCWizard({ open, onOpenChange, onSuccess }: KYCWizardProps) {
    /**
     * [COMPONENT] KYC Wizard
     * ----------------------
     * Purpose: Smart identity verification modal.
     * Features:
     * - Live Webcam Capture: 'react-webcam' integration.
     * - OCR Scanning: 'tesseract.js' to extract CNIC data from images.
     * - State Management: Multi-step form data collection.
     */
    const [kycData, setKycData] = useState({
        cnic: "",
        expiry: "",
        front: null as File | null,
        back: null as File | null,
        face: null as File | null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [scanning, setScanning] = useState<"front" | "back" | "face" | null>(null);
    const [ocrStatus, setOcrStatus] = useState<string>("");
    const { toast } = useToast();

    const webcamRef = useRef<Webcam>(null);

    // [LOGIC] Image Capture
    // Captures screenshot from video feed, converts to File object.
    const capture = useCallback(async (mode: "front" | "back" | "face") => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        // Convert base64 to file
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `${mode}_scan.jpg`, { type: "image/jpeg" });

        if (mode === "face") {
            setKycData(prev => ({ ...prev, face: file }));
            setScanning(null);
            return;
        }

        // OCR Verification for CNIC
        if (kycData.cnic) {
            setOcrStatus("Scanning text...");
            try {
                // [FEATURE] Client-Side OCR
                // Attempts to read text from the captured image to verify/autofill CNIC.
                const { data: { text } } = await Tesseract.recognize(imageSrc, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setOcrStatus(`Scanning: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });

                // Simple check if CNIC number (or part of it) is in the text
                // Removing dashes for looser matching
                const cleanCNIC = kycData.cnic.replace(/-/g, "");
                const cleanText = text.replace(/[^0-9]/g, "");

                if (cleanText.includes(cleanCNIC) || cleanText.includes(cleanCNIC.substring(0, 5))) {
                    toast({ title: "Verified", description: "CNIC number matched in scan.", className: "bg-green-500 text-white" });
                    setKycData(prev => ({ ...prev, [mode]: file }));
                    setScanning(null);
                } else {
                    if (confirm("Could not clearly read the CNIC number. Use this image anyway?")) {
                        setKycData(prev => ({ ...prev, [mode]: file }));
                        setScanning(null);
                    } else {
                        setOcrStatus("Try again. Ensure good lighting and focus.");
                    }
                }
            } catch (e) {
                console.error(e);
                setOcrStatus("OCR Failed. Please try again or upload manually.");
            }
        } else {
            // If no CNIC entered yet, just save
            setKycData(prev => ({ ...prev, [mode]: file }));
            setScanning(null);
        }
        setOcrStatus("");
    }, [webcamRef, kycData.cnic]);

    const handleSubmit = async () => {
        if (!kycData.cnic || !kycData.expiry || !kycData.front || !kycData.back) {
            toast({ title: "Incomplete", description: "Please provide all required KYC details.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("cnic_number", kycData.cnic);
            formData.append("cnic_expiry", kycData.expiry);
            formData.append("cnic_front", kycData.front);
            formData.append("cnic_back", kycData.back);
            if (kycData.face) {
                formData.append("face_scan", kycData.face);
            }

            await api.post("/kyc/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({ title: "Submitted", description: "KYC submitted for verification." });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "KYC submission failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Complete KYC Verification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {scanning ? (
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex flex-col items-center justify-center">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "environment" }}
                            />
                            {/* Overlays */}
                            <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
                                {scanning === 'face' ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-80 border-4 border-accent rounded-[50%]"></div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-12 border-2 border-accent rounded-lg"></div>
                                )}
                            </div>

                            <div className="absolute bottom-4 flex flex-col items-center gap-2 w-full">
                                {ocrStatus && <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">{ocrStatus}</div>}
                                <div className="flex gap-4">
                                    <Button variant="destructive" size="icon" onClick={() => { setScanning(null); setOcrStatus(""); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button variant="default" size="icon" className="h-12 w-12 rounded-full" onClick={() => capture(scanning)}>
                                        <Camera className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cnic">CNIC Number</Label>
                                    <Input
                                        id="cnic"
                                        placeholder="XXXXX-XXXXXXX-X"
                                        value={kycData.cnic}
                                        onChange={(e) => setKycData({ ...kycData, cnic: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">CNIC Expiry Date</Label>
                                    <Input
                                        id="expiry"
                                        type="date"
                                        value={kycData.expiry}
                                        onChange={(e) => setKycData({ ...kycData, expiry: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Front Image */}
                            <div className="space-y-2">
                                <Label>CNIC Front</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setScanning('front')}>
                                        <Camera className="mr-2 h-4 w-4" /> Scan
                                    </Button>
                                    <div className="relative flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="opacity-0 absolute inset-0 cursor-pointer"
                                            onChange={(e) => e.target.files && setKycData({ ...kycData, front: e.target.files[0] })}
                                        />
                                        <Button variant="secondary" className="w-full pointer-events-none">
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </div>
                                </div>
                                {kycData.front && <div className="text-xs text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Captured</div>}
                            </div>

                            {/* Back Image */}
                            <div className="space-y-2">
                                <Label>CNIC Back</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setScanning('back')}>
                                        <Camera className="mr-2 h-4 w-4" /> Scan
                                    </Button>
                                    <div className="relative flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="opacity-0 absolute inset-0 cursor-pointer"
                                            onChange={(e) => e.target.files && setKycData({ ...kycData, back: e.target.files[0] })}
                                        />
                                        <Button variant="secondary" className="w-full pointer-events-none">
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </div>
                                </div>
                                {kycData.back && <div className="text-xs text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Captured</div>}
                            </div>

                            {/* Face Scan */}
                            <div className="space-y-2">
                                <Label>Face Scan (Optional)</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setScanning('face')}>
                                        <Camera className="mr-2 h-4 w-4" /> Scan Face
                                    </Button>
                                    <div className="relative flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="opacity-0 absolute inset-0 cursor-pointer"
                                            onChange={(e) => e.target.files && setKycData({ ...kycData, face: e.target.files[0] })}
                                        />
                                        <Button variant="secondary" className="w-full pointer-events-none">
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </div>
                                </div>
                                {kycData.face && <div className="text-xs text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Captured</div>}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit KYC"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
