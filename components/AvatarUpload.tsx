"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  currentUrl?: string | null;
  userId: string;
  name: string;
  onUpload: (url: string) => void;
  size?: number;
}

export function AvatarUpload({ currentUrl, userId, name, onUpload, size = 80 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      onUpload(url);
    }
    setUploading(false);
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center font-black text-white cursor-pointer"
        style={{ background: currentUrl ? "transparent" : "linear-gradient(135deg, #4f46e5, #7c3aed)", fontSize: size * 0.3 }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          <Image src={currentUrl} alt={name} fill className="object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Camera overlay */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ background: "#4f46e5", border: "2px solid #ffffff" }}
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
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
