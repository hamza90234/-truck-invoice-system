"use client";

import { useState, useRef } from "react";
import { Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";

export interface ExtractedVehicleData {
  vin: string;
  unitNumber?: string;
  year?: number | null;
  make?: string;
  model?: string;
  licensePlate?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}

interface AiVinScannerProps {
  onScanComplete: (data: ExtractedVehicleData) => void;
  className?: string;
  buttonLabel?: string;
  compact?: boolean;
}

export default function AiVinScanner({
  onScanComplete,
  className = "",
  buttonLabel = "Scan VIN with AI",
  compact = false,
}: AiVinScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastResult, setLastResult] = useState<ExtractedVehicleData | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerClick = () => {
    setErrorMessage("");
    setLastResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, HEIC, etc.)");
      setShowModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      if (!base64String) return;

      setPreviewImage(base64String);
      setShowModal(true);
      await performAiScan(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const performAiScan = async (base64Image: string) => {
    setScanning(true);
    setErrorMessage("");
    setScanStatus("AI analyzing VIN sticker, cab specs & barcode...");

    try {
      const res = await apiFetch(`${API_URL}/api/ai/scan-vin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "AI scanner was unable to read the image.");
      }

      const result = await res.json();
      const extracted = result.data as ExtractedVehicleData;

      if (!extracted || !extracted.vin) {
        throw new Error("No clear VIN detected in this photo. Please take a closer photo of the door jamb sticker or registration card.");
      }

      setLastResult(extracted);
      setScanStatus("VIN extracted successfully!");
      onScanComplete(extracted);

      // Auto-close modal after brief visual confirmation
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to scan VIN.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      {/* Hidden file input with environment camera support for mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={scanning}
        className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
          compact
            ? "px-2.5 py-1.5 rounded-lg text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
            : "px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
        }`}
      >
        <Camera className="h-4 w-4 shrink-0" />
        <Sparkles className="h-3 w-3 text-amber-300 animate-pulse shrink-0" />
        <span>{buttonLabel}</span>
      </button>

      {/* Scanner Progress / Result Bottom Sheet / Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => !scanning && setShowModal(false)} />

          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Top Drag Indicator for mobile */}
            <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-slate-50/80">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    AI VIN Recognition
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    OpenAI Vision Scanner
                  </p>
                </div>
              </div>

              {!scanning && (
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-center">
              {/* Photo Preview with Laser Line Animation */}
              {previewImage && (
                <div className="relative w-full max-h-56 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 shadow-inner">
                  <img
                    src={previewImage}
                    alt="VIN Photo"
                    className="max-h-56 w-auto object-contain"
                  />

                  {/* Animated Scanner Laser Overlay while scanning */}
                  {scanning && (
                    <div className="absolute inset-0 pointer-events-none bg-blue-500/10 flex flex-col justify-center">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-bounce" />
                    </div>
                  )}
                </div>
              )}

              {/* Status Message */}
              {scanning && (
                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{scanStatus}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Detecting 17-character VIN, unit number, year, make & model...
                  </p>
                </div>
              )}

              {/* Success Result Box */}
              {lastResult && !scanning && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>VIN Extracted Successfully!</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono text-slate-900 font-bold text-base tracking-wider text-center">
                    {lastResult.vin}
                  </div>

                  {(lastResult.year || lastResult.make || lastResult.model || lastResult.unitNumber) && (
                    <div className="text-xs text-emerald-900 font-medium flex items-center gap-2 flex-wrap pt-1">
                      {lastResult.unitNumber && (
                        <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          Unit #{lastResult.unitNumber}
                        </span>
                      )}
                      {(lastResult.year || lastResult.make || lastResult.model) && (
                        <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {lastResult.year || ""} {lastResult.make || ""} {lastResult.model || ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Box */}
              {errorMessage && !scanning && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-3">
                  <div className="flex items-start gap-2 text-rose-800 font-semibold text-xs sm:text-sm">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTriggerClick}
                      className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}

              <div className="h-6 sm:h-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
