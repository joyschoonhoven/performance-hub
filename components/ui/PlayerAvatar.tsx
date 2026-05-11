"use client";

import Image from "next/image";
import type { PositionType } from "@/lib/types";

interface PlayerAvatarProps {
  photoUrl?: string | null;
  name: string;
  position?: PositionType;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showPositionDot?: boolean;
  ring?: boolean;
}

const SIZE_PX: Record<NonNullable<PlayerAvatarProps["size"]>, number> = {
  sm: 32,
  md: 48,
  lg: 80,
  xl: 120,
};

const DOT_PX: Record<NonNullable<PlayerAvatarProps["size"]>, number> = {
  sm: 8,
  md: 11,
  lg: 16,
  xl: 22,
};

const FONT_PX: Record<NonNullable<PlayerAvatarProps["size"]>, number> = {
  sm: 11,
  md: 16,
  lg: 26,
  xl: 38,
};

// Group positions into 4 buckets with distinct colors
function positionColor(p?: PositionType): string {
  if (!p) return "#8A9BB0";
  if (p === "GK") return "#F0A500";                         // amber
  if (["CB", "LB", "RB"].includes(p)) return "#1B6CA8";     // sfa-blue (defense)
  if (["CDM", "CM", "CAM"].includes(p)) return "#16A34A";   // emerald (mid)
  return "#D64045";                                          // sfa-red (forward)
}

export function PlayerAvatar({
  photoUrl,
  name,
  position,
  size = "md",
  className = "",
  showPositionDot = true,
  ring = true,
}: PlayerAvatarProps) {
  const px = SIZE_PX[size];
  const dot = DOT_PX[size];
  const font = FONT_PX[size];

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: px,
        height: px,
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          overflow: "hidden",
          background: photoUrl
            ? "transparent"
            : "linear-gradient(135deg, #0D1B2A 0%, #1A2E45 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: font,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          boxShadow: ring ? "0 0 0 2px rgba(77,174,229,0.25)" : "none",
        }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={px}
            height={px}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
            unoptimized
          />
        ) : (
          <span style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>{initials}</span>
        )}
      </div>

      {showPositionDot && position && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dot,
            height: dot,
            borderRadius: "50%",
            background: positionColor(position),
            border: "1.5px solid #FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
          aria-label={position}
          title={position}
        />
      )}
    </div>
  );
}
