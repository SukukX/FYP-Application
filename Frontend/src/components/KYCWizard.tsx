import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Camera, Upload, RefreshCw, Check, X, ImageIcon } from "lucide-react";

interface ExistingKyc {
    cnic_number: string;
    cnic_expiry: string;
    cnic_front: string | null;
    cnic_back: string | null;
    face_scan: string | null;
}

interface KYCWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    existingKyc?: ExistingKyc | null; // Pass existing data on resubmission
}

export function KYCWizard({ open, onOpenChange, onSuccess, existingKyc }: KYCWizardProps) {
    const isResubmission = !!existingKyc;

    const [kycData, setKycData] = useState({
        cnic: existingKyc?.cnic_number || "",
        expiry: existingKyc?.cnic_expiry
            ? new Date(existingKyc.cnic_expiry).toISOString().split("T")[0]
            : "",
        front: null as File | null,
        back: null as File | null,
        face: null as File | null,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [scanning, setScanning] = useState<"front" | "back" | "face" | null>(null);
    const [ocrStatus, setOcrStatus] = useState<string>("");
    const { toast } = useToast();
    const webcamRef = useRef<Webcam>(null);

    const capture = useCallback(async (mode: "front" | "back" | "face") => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `${mode}_scan.jpg`, { type: "image/jpeg" });

        if (mode === "face") {
            setKycData(prev => ({ ...prev, face: file }));
            setScanning(null);
            return;
        }

        if (kycData.cnic) {
            setOcrStatus("Scanning text...");
            try {
                const { data: { text } } = await Tesseract.recognize(imageSrc, "eng", {
                    logger: m => {
                        if (m.status === "recognizing text") {
                            setOcrStatus(`Scanning: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                });

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
            setKycData(prev => ({ ...prev, [mode]: file }));
            setScanning(null);
        }
        setOcrStatus("");
    }, [webcamRef, kycData.cnic]);

    const handleSubmit = async () => {
        if (!kycData.cnic || !kycData.expiry) {
            toast({ title: "Incomplete", description: "Please fill in CNIC number and expiry.", variant: "destructive" });
            return;
        }
        // For new submissions (not resubmission), require front and back
        if (!isResubmission && (!kycData.front || !kycData.back)) {
            toast({ title: "Incomplete", description: "Please provide CNIC front and back images.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("cnic_number", kycData.cnic);
            formData.append("cnic_expiry", kycData.expiry);
            // Only append files if user picked new ones — backend preserves old ones otherwise
            if (kycData.front) formData.append("cnic_front", kycData.front);
            if (kycData.back) formData.append("cnic_back", kycData.back);
            if (kycData.face) formData.append("face_scan", kycData.face);

            await api.post("/kyc/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({ title: isResubmission ? "Resubmitted" : "Submitted", description: "KYC submitted for verification." });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "KYC submission failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    /** Helper: shows existing doc thumbnail + change option */
    const DocField = ({
        label,
        mode,
        existingUrl,
        currentFile,
    }: {
        label: string;
        mode: "front" | "back" | "face";
        existingUrl?: string | null;
        currentFile: File | null;
    }) => (
        <div className="space-y-2">
            <Label>{label}{mode !== "face" ? "" : " (Optional)"}</Label>
            {/* Show existing image if available and user hasn't replaced it */}
            {existingUrl && !currentFile && (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                    <img src={existingUrl} alt={label} className="h-14 w-20 object-cover rounded border" />
                    <div className="flex-1 text-xs text-muted-foreground">
                        <p className="font-medium text-primary">Current document</p>
                        <p>Will be kept unless you upload a new one</p>
                    </div>
                </div>
            )}
            {currentFile && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                    <Check className="h-3 w-3" /> New file selected: {currentFile.name}
                    <button className="text-muted-foreground hover:text-destructive ml-1" onClick={() => setKycData(prev => ({ ...prev, [mode]: null }))}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setScanning(mode)}>
                    <Camera className="mr-2 h-4 w-4" /> Scan
                </Button>
                <div className="relative flex-1">
                    <Input
                        type="file"
                        accept="image/*"
                        className="opacity-0 absolute inset-0 cursor-pointer"
                        onChange={(e) => e.target.files && setKycData(prev => ({ ...prev, [mode]: e.target.files![0] }))}
                    />
                    <Button variant="secondary" className="w-full pointer-events-none">
                        <Upload className="mr-2 h-4 w-4" /> {existingUrl ? "Replace" : "Upload"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isResubmission ? "Resubmit KYC Verification" : "Complete KYC Verification"}
                    </DialogTitle>
                    {isResubmission && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Your previous documents are shown below. You can update any field or keep existing documents.
                        </p>
                    )}
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
                            <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
                                {scanning === "face" ? (
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

                            <DocField
                                label="CNIC Front"
                                mode="front"
                                existingUrl={existingKyc?.cnic_front}
                                currentFile={kycData.front}
                            />
                            <DocField
                                label="CNIC Back"
                                mode="back"
                                existingUrl={existingKyc?.cnic_back}
                                currentFile={kycData.back}
                            />
                            <DocField
                                label="Face Scan (Optional)"
                                mode="face"
                                existingUrl={existingKyc?.face_scan}
                                currentFile={kycData.face}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Submitting..." : isResubmission ? "Resubmit KYC" : "Submit KYC"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
