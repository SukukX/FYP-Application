import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Camera, Upload, RefreshCw, Check, X, ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { kycSubmissionSchema } from "@/lib/validation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    existingKyc?: ExistingKyc | null;
}

export function KYCWizard({ open, onOpenChange, onSuccess, existingKyc }: KYCWizardProps) {
    const { user } = useAuth();
    const isResubmission = !!existingKyc;

    const [kycFiles, setKycFiles] = useState({
        front: null as File | null,
        back: null as File | null,
        face: null as File | null,
    });

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(kycSubmissionSchema),
        defaultValues: {
            cnic_number: user?.cnic || existingKyc?.cnic_number || "",
            cnic_expiry: existingKyc?.cnic_expiry
                ? new Date(existingKyc.cnic_expiry).toISOString().split("T")[0]
                : "",
        },
    });

    const [isLoading, setIsLoading] = useState(false);
    const [scanning, setScanning] = useState<"front" | "back" | "face" | null>(null);
    const [ocrStatus, setOcrStatus] = useState<string>("");
    const [formError, setFormError] = useState<string | null>(null);
    const [ocrWarning, setOcrWarning] = useState<string | null>(null);
    
    // [FIX] Auto-populate CNIC when user data arrives
    useEffect(() => {
        if (user?.cnic && !isResubmission) {
            setValue("cnic_number", user.cnic);
        } else if (existingKyc?.cnic_number) {
            setValue("cnic_number", existingKyc.cnic_number);
        }
    }, [user, existingKyc, setValue, isResubmission]);
    
    const webcamRef = useRef<Webcam>(null);

    const capture = useCallback(async (mode: "front" | "back" | "face") => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `${mode}_scan.jpg`, { type: "image/jpeg" });

        if (mode === "face") {
            setKycFiles(prev => ({ ...prev, face: file }));
            setScanning(null);
            return;
        }

        const registeredCnic = user?.cnic || existingKyc?.cnic_number;
        if (registeredCnic) {
            setOcrStatus("Analyzing document...");
            try {
                const { data: { text } } = await Tesseract.recognize(imageSrc, "eng");

                const cleanCNIC = registeredCnic.replace(/-/g, "");
                const cleanText = text.replace(/[^0-9]/g, "");

                if (cleanText.includes(cleanCNIC) || cleanText.includes(cleanCNIC.substring(0, 5))) {
                    setKycFiles(prev => ({ ...prev, [mode]: file }));
                    setScanning(null);
                    setOcrWarning(null);
                } else {
                    setOcrWarning(`OCR mismatch. Please ensure this is the correct CNIC document for ${registeredCnic}.`);
                    setKycFiles(prev => ({ ...prev, [mode]: file })); // Still allow but warn
                    setScanning(null);
                }
            } catch (e) {
                setOcrStatus("OCR Failed. Image captured.");
                setKycFiles(prev => ({ ...prev, [mode]: file }));
                setScanning(null);
            }
        } else {
            setKycFiles(prev => ({ ...prev, [mode]: file }));
            setScanning(null);
        }
        setOcrStatus("");
    }, [webcamRef, user, existingKyc]);

    const onSubmit = async (values: any) => {
        if (!isResubmission && (!kycFiles.front || !kycFiles.back)) {
            setFormError("Please provide both front and back images of your CNIC.");
            return;
        }

        setIsLoading(true);
        setFormError(null);
        try {
            const formData = new FormData();
            formData.append("cnic_number", values.cnic_number);
            formData.append("cnic_expiry", values.cnic_expiry);
            if (kycFiles.front) formData.append("cnic_front", kycFiles.front);
            if (kycFiles.back) formData.append("cnic_back", kycFiles.back);
            if (kycFiles.face) formData.append("face_scan", kycFiles.face);

            await api.post("/kyc/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "KYC submission failed. Please check your data.");
        } finally {
            setIsLoading(false);
        }
    };

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
            <Label className="text-sm font-semibold">{label}{mode === "face" ? " (Face Scan)" : ""}</Label>
            {existingUrl && !currentFile && (
                <div className="flex items-center gap-3 p-2 border rounded-md bg-accent/5">
                    <img src={existingUrl} alt={label} className="h-12 w-16 object-cover rounded border" />
                    <div className="flex-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <p className="font-bold text-accent">Stored Image</p>
                    </div>
                </div>
            )}
            {currentFile && (
                <div className="flex items-center justify-between p-2 border border-verified bg-verified/5 rounded-md text-xs text-verified">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Ready to upload: {currentFile.name.substring(0, 20)}...</span>
                    </div>
                    <button onClick={() => setKycFiles(prev => ({ ...prev, [mode]: null }))}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                </div>
            )}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => setScanning(mode)}>
                    <Camera className="mr-2 h-3 w-3" /> Scan
                </Button>
                <div className="relative flex-1">
                    <Input
                        type="file"
                        accept="image/*"
                        className="opacity-0 absolute inset-0 cursor-pointer z-20"
                        onChange={(e) => e.target.files && setKycFiles(prev => ({ ...prev, [mode]: e.target.files![0] }))}
                    />
                    <Button variant="secondary" size="sm" className="w-full h-9 pointer-events-none">
                        <Upload className="mr-2 h-3 w-3" /> {existingUrl ? "Replace" : "Upload"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isResubmission ? "Update Identity Verification" : "Identity Verification"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-2">
                    {scanning ? (
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover opacity-80"
                                videoConstraints={{ facingMode: "environment" }}
                            />
                            <div className="absolute inset-0 border-2 border-white/20 pointer-events-none">
                                {scanning === "face" ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-48 h-64 border-2 border-accent/50 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-8 border-2 border-accent/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
                                )}
                            </div>
                            <div className="absolute bottom-4 flex flex-col items-center gap-3 w-full px-4">
                                {ocrStatus && <div className="bg-black/80 text-white px-4 py-1.5 rounded-full text-xs font-medium animate-pulse">{ocrStatus}</div>}
                                <div className="flex gap-6">
                                    <Button variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={() => { setScanning(null); setOcrStatus(""); }}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <Button variant="default" size="icon" className="h-12 w-12 rounded-full ring-4 ring-white/20" onClick={() => capture(scanning)}>
                                        <Camera className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {ocrWarning && (
                                <Alert className="bg-amber-50 border-amber-200 text-amber-800 py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-[11px] leading-tight">{ocrWarning}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cnic_number" className="text-xs">CNIC Number</Label>
                                    <Input
                                        id="cnic_number"
                                        readOnly
                                        className="bg-muted h-9 text-xs"
                                        {...register("cnic_number")}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cnic_expiry" className="text-xs">Expiry Date *</Label>
                                    <Input
                                        id="cnic_expiry"
                                        type="date"
                                        className="h-9 text-xs"
                                        {...register("cnic_expiry")}
                                        error={errors.cnic_expiry?.message}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <DocField
                                    label="CNIC Front Image *"
                                    mode="front"
                                    existingUrl={existingKyc?.cnic_front}
                                    currentFile={kycFiles.front}
                                />
                                <DocField
                                    label="CNIC Back Image *"
                                    mode="back"
                                    existingUrl={existingKyc?.cnic_back}
                                    currentFile={kycFiles.back}
                                />
                                <DocField
                                    label="Liveness Face Scan"
                                    mode="face"
                                    existingUrl={existingKyc?.face_scan}
                                    currentFile={kycFiles.face}
                                />
                            </div>

                            {formError && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertDescription className="text-xs">{formError}</AlertDescription>
                                </Alert>
                            )}

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                                <Button type="submit" size="sm" className="min-w-[120px]" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isResubmission ? "Update KYC" : "Verify Identity")}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
