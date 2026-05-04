"use client";

import { getIndexLabel } from "@/lib/match-stats";

interface PerformanceIndexCardProps {
  index: number;
  previousIndex?: number;
  matches: number;
  position?: string;
  size?: "sm" | "md" | "lg";
}

export function PerformanceIndexCard({
  index,
  previousIndex,
  matches,
  position,
  size = "md",
}: PerformanceIndexCardProps) {
  const { label, color } = getIndexLabel(index);
  const trend = previousIndex !== undefined ? index - previousIndex : 0;

  // SVG ring gauge
  const radius = size === "lg" ? 54 : size === "sm" ? 32 : 44;
  const stroke = size === "lg" ? 8 : size === "sm" ? 5 : 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (index / 100) * circumference;
  const svgSize = (radius + stroke) * 2 + 4;

  const labelSize = size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl";
  const subSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex flex-col items-center">
      {/* Ring */}
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#E4E7EB"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className={`${labelSize} font-black tabular-nums leading-none`}
            style={{ color, fontFamily: "Outfit, sans-serif" }}
          >
            {index}
          </span>
          <span className={`${subSize} text-slate-400 uppercase tracking-widest font-bold mt-0.5`}>
            INDEX
          </span>
        </div>
      </div>

      {/* Label + trend */}
      <div className="mt-3 text-center space-y-1">
        <div
          className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
        >
          {label}
        </div>
        <div className="flex items-center justify-center gap-3">
          {trend !== 0 && (
            <span
              className={`text-xs font-bold flex items-center gap-0.5`}
              style={{ color: trend > 0 ? "#4FA9E6" : "#ef4444" }}
            >
              {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            {matches} wedstrijd{matches !== 1 ? "en" : ""}
          </span>
          {position && (
            <span className="text-[11px] font-bold text-slate-500">{position}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compact inline version for tables ──
interface IndexBadgeProps {
  index: number;
}

export function IndexBadge({ index }: IndexBadgeProps) {
  const { color } = getIndexLabel(index);
  return (
    <span
      className="inline-flex items-center justify-center text-xs font-black tabular-nums w-10 h-6 rounded-md"
      style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}
    >
      {index}
    </span>
  );
}
