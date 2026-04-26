"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  currentUrl?: string | null;
  userId: string;
  name: string;
  onUpload: (url: string) => void;
  size?: number;
}

export function AvatarUpload({ currentUrl, userId: _userId, name, onUpload, size = 80 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [bgStatus, setBgStatus] = useState<"idle" | "removing" | "uploading">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const displayUrl = preview ?? currentUrl;

  async function removeBackground(file: File): Promise<File> {
    // Dynamically import to avoid SSR issues with WASM
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(file);
    return new File([blob], "avatar.png", { type: "image/png" });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate local preview of original
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    setError(null);

    try {
      // Step 1: remove background
      setBgStatus("removing");
      const processedFile = await removeBackground(file);

      // Update preview to show background-removed result
      URL.revokeObjectURL(objectUrl);
      const processedUrl = URL.createObjectURL(processedFile);
      setPreview(processedUrl);

      // Step 2: upload processed file
      setBgStatus("uploading");
      const formData = new FormData();
      formData.append("file", processedFile);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json() as { url?: string; error?: string };

      if (!res.ok || !json.url) {
        setError(json.error ?? "Upload mislukt");
        setPreview(null);
      } else {
        URL.revokeObjectURL(processedUrl);
        setPreview(null);
        onUpload(json.url);
      }
    } catch (err) {
      console.error("[AvatarUpload] background removal error:", err);
      // Fallback: upload original without background removal
      setBgStatus("uploading");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
        const json = await res.json() as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          setError(json.error ?? "Upload mislukt");
          setPreview(null);
        } else {
          URL.revokeObjectURL(objectUrl);
          setPreview(null);
          onUpload(json.url);
        }
      } catch {
        setError("Verbindingsfout, probeer opnieuw");
        setPreview(null);
      }
    } finally {
      setUploading(false);
      setBgStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const statusLabel = bgStatus === "removing"
    ? "Achtergrond verwijderen…"
    : bgStatus === "uploading"
    ? "Uploaden…"
    : null;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center font-black text-white cursor-pointer"
        style={{
          background: displayUrl ? "transparent" : "linear-gradient(135deg, #4FA9E6, #0A2540)",
          fontSize: size * 0.3,
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {displayUrl ? (
          <Image src={displayUrl} alt={name} fill className="object-contain" unoptimized />
        ) : (
          initials
        )}
      </div>

      {/* Camera overlay button */}
      <button
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        aria-label="Foto uploaden"
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md"
        style={{ background: "#4FA9E6", border: "2px solid #ffffff" }}
      >
        {uploading ? (
          <Loader2 size={12} className="animate-spin text-white" />
        ) : (
          <Camera size={12} className="text-white" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {/* Status label */}
      {statusLabel && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/80 bg-black/70 rounded-lg px-2.5 py-1.5 z-20 whitespace-nowrap"
        >
          {statusLabel}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 z-20"
          style={{ width: "max-content", maxWidth: 220 }}
        >
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
