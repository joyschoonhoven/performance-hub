"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PositionType } from "@/lib/types";

interface PlayerPhotoUploadProps {
  playerId: string;
  initialPhotoUrl?: string | null;
  name: string;
  position?: PositionType;
  onUploaded?: (url: string) => void;
  size?: "lg" | "xl";
}

/**
 * Compress an image to max 400x400 (or less, preserving aspect) using canvas API.
 * Returns a Blob in JPEG format.
 */
async function compressImage(file: File, maxSize = 400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export function PlayerPhotoUpload({
  playerId,
  initialPhotoUrl,
  name,
  position,
  onUploaded,
  size = "xl",
}: PlayerPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Alleen afbeeldingen toegestaan");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const supabase = createClient();
      const path = `${playerId}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("player-photos")
        .upload(path, compressed, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("player-photos").getPublicUrl(path);
      // Cache-bust so the new image loads immediately
      const url = `${pub.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("players")
        .update({ photo_url: url })
        .eq("id", playerId);
      if (dbErr) throw dbErr;

      setPhotoUrl(url);
      onUploaded?.(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload mislukt";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <PlayerAvatar
        photoUrl={photoUrl}
        name={name}
        position={position}
        size={size}
        showPositionDot
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--sfa-blue)",
          color: "#fff",
          border: "2px solid #fff",
          borderRadius: 999,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 600,
          cursor: uploading ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap",
        }}
      >
        {uploading
          ? <><Loader2 size={11} className="animate-spin" /> Uploaden</>
          : <><Camera size={11} /> {photoUrl ? "Wijzig" : "Upload"}</>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p style={{
          position: "absolute",
          bottom: -28,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "var(--sfa-red)",
          fontWeight: 600,
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
