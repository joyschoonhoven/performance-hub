"use client";

import Image from "next/image";
import Link from "next/link";
import type { PositionType } from "@/lib/types";

interface FifaPlayerCardProps {
  playerId?: string;
  href?: string;
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  position: PositionType;
  rating: number;
  club?: string;
  stats: { label: string; value: number | string }[]; // typically 3 stats: e.g. TEC / FYS / TAC
  highlight?: boolean; // gold ring for top performer
}

export function FifaPlayerCard({
  playerId,
  href,
  photoUrl,
  firstName,
  lastName,
  position,
  rating,
  club,
  stats,
  highlight,
}: FifaPlayerCardProps) {
  const ratingColor = rating >= 85 ? "#F0A500" : rating >= 75 ? "#4DAEE5" : "#E6F4FC";

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  const card = (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3/4.4",
        borderRadius: 14,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0D1B2A 0%, #1A2E45 60%, #0D1B2A 100%)",
        boxShadow: highlight
          ? "0 0 0 2px #F0A500, 0 8px 24px rgba(240,165,0,0.2)"
          : "0 4px 14px rgba(13,27,42,0.18)",
        color: "#fff",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: href ? "pointer" : "default",
      }}
      className="group"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
    >
      {/* Decorative diagonal gradient */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 110,
        height: 110,
        background: `radial-gradient(circle at top right, ${ratingColor}30 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Top stats: rating + position */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 14,
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}>
        <div style={{
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: ratingColor,
          fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace",
          lineHeight: 0.9,
        }}>
          {rating}
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: rating >= 85 ? "#F0A500" : "#4DAEE5",
          marginTop: 2,
        }}>
          {position}
        </div>
      </div>

      {/* Center: photo or initials */}
      <div style={{
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        bottom: 95,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1,
      }}>
        {photoUrl ? (
          <div style={{ position: "relative", width: "80%", aspectRatio: "1/1.05" }}>
            <Image
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              fill
              style={{ objectFit: "cover", objectPosition: "top center" }}
              unoptimized
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, transparent 60%, #0D1B2A 100%)",
            }} />
          </div>
        ) : (
          <div style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(77,174,229,0.25), rgba(27,108,168,0.1))",
            border: "2px solid rgba(77,174,229,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: "#4DAEE5",
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}>
            {initials}
          </div>
        )}
      </div>

      {/* Bottom: name + stats */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "10px 14px 14px",
        zIndex: 4,
        background: "linear-gradient(180deg, transparent 0%, #0D1B2A 50%)",
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          marginBottom: 1,
        }}>
          {firstName}
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          lineHeight: 1.05,
          marginBottom: 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {lastName}
        </div>

        {club && (
          <div style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {club}
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
          gap: 6,
          paddingTop: 8,
          borderTop: "1px solid rgba(77,174,229,0.18)",
        }}>
          {stats.slice(0, 3).map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 8,
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#4DAEE5",
                fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace",
                marginTop: 1,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {card}
    </Link>
  ) : card;
}
