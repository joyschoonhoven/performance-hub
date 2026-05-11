"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

/* ────────────────────────────────────────────────────── */
/*  StatCard                                              */
/* ────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: "up" | "down"; pct: number };
  icon?: ReactNode;
  accent?: string;
  sparkline?: number[];
}

export function StatCard({ label, value, hint, trend, icon, accent = "var(--sfa-blue)", sparkline }: StatCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 3, height: "100%", background: accent,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            color: "var(--text-muted)", textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        {icon && (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            background: `${accent}14`, color: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </span>
        )}
      </div>

      <div style={{
        fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em",
        color: "var(--sfa-navy)", lineHeight: 1.05,
        fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace",
      }}>
        {value}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        {trend && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600,
            color: trend.direction === "up" ? "var(--green)" : "var(--sfa-red)",
          }}>
            {trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.pct}%
          </span>
        )}
        {hint && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</span>}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div style={{ marginTop: 10, height: 32 }}>
          <Sparkline data={sparkline} color={accent} />
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const h = 30;
  const xs = (i: number) => (i / (data.length - 1)) * w;
  const ys = (v: number) => h - ((v - min) / range) * h;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(v).toFixed(1)}`).join(" ");
  const fillPath = `${path} L${w},${h} L0,${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────── */
/*  Badge                                                 */
/* ────────────────────────────────────────────────────── */

type BadgeVariant = "position" | "status" | "neutral" | "info";
type PositionGroup = "GK" | "DEF" | "MID" | "FWD";
type StatusKind = "active" | "injured" | "inactive";

interface BadgeProps {
  variant?: BadgeVariant;
  position?: PositionGroup;
  status?: StatusKind;
  children: ReactNode;
}

export function Badge({ variant = "neutral", position, status, children }: BadgeProps) {
  let bg = "var(--bg)";
  let color = "var(--text-2)";
  let border = "1px solid var(--border)";

  if (variant === "position" && position) {
    const map: Record<PositionGroup, { bg: string; color: string }> = {
      GK:  { bg: "rgba(240,165,0,0.12)", color: "#B07700" },
      DEF: { bg: "rgba(27,108,168,0.12)", color: "#1B6CA8" },
      MID: { bg: "rgba(22,163,74,0.12)", color: "#15803D" },
      FWD: { bg: "rgba(214,64,69,0.12)", color: "#B0353A" },
    };
    bg = map[position].bg;
    color = map[position].color;
    border = "none";
  } else if (variant === "status" && status) {
    const map: Record<StatusKind, { bg: string; color: string }> = {
      active:   { bg: "rgba(22,163,74,0.12)",  color: "#15803D" },
      injured:  { bg: "rgba(214,64,69,0.12)",  color: "#B0353A" },
      inactive: { bg: "rgba(138,155,176,0.18)", color: "#5A6D85" },
    };
    bg = map[status].bg;
    color = map[status].color;
    border = "none";
  } else if (variant === "info") {
    bg = "rgba(27,108,168,0.1)";
    color = "#1B6CA8";
    border = "none";
  }

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 10px", borderRadius: 999,
        background: bg, color, border,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────── */
/*  EmptyState                                            */
/* ────────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      padding: "48px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      {icon && (
        <div style={{
          color: "rgba(77,174,229,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
        color: "var(--sfa-navy)",
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: 13, color: "var(--text-muted)",
          maxWidth: 380, lineHeight: 1.5,
        }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/*  ProgressBar                                           */
/* ────────────────────────────────────────────────────── */

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, label, color, showLabel = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || showLabel) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 4,
        }}>
          {label && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>}
          {showLabel && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: color ?? "var(--sfa-blue)",
              fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace",
            }}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div style={{
        height: 6, borderRadius: 999,
        background: "var(--sfa-sky-light)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${clamped}%`,
          background: color
            ? `linear-gradient(90deg, ${color}, ${color}cc)`
            : "linear-gradient(90deg, var(--sfa-blue), var(--sfa-sky))",
          borderRadius: 999,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}
