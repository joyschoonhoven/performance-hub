"use client";

import { useMemo } from "react";

interface RadarData {
  subject: string;
  value: number;
  fullMark?: number;
}

interface PlayerRadarChartProps {
  data: RadarData[];
  color?: string;
  size?: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
}

// Apply subtle perspective tilt — flattens top/bottom slightly for 3D feel
function applyPerspective(cx: number, cy: number, p: { x: number; y: number }, tilt = 0.82) {
  return { x: p.x, y: cy + (p.y - cy) * tilt };
}

export function PlayerRadarChart({ data, color = "#00b891", size = 280 }: PlayerRadarChartProps) {
  const cx = size / 2;
  const cy = size / 2 - 4;
  const maxR = (size / 2) * 0.68;
  const n = data.length;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const { gridPolys, dataPoints, axisPoints, labelPoints } = useMemo(() => {
    const angles = data.map((_, i) => (i / n) * 360);

    const gridPolys = levels.map((level) =>
      angles.map((a) => applyPerspective(cx, cy, polarToXY(cx, cy, maxR * level, a)))
    );

    const dataPoints = data.map((d, i) => {
      const val = Math.min(Math.max(d.value / (d.fullMark ?? 10), 0), 1);
      return applyPerspective(cx, cy, polarToXY(cx, cy, maxR * val, angles[i]));
    });

    const axisPoints = angles.map((a) =>
      applyPerspective(cx, cy, polarToXY(cx, cy, maxR, a))
    );

    const labelR = maxR * 1.22;
    const labelPoints = angles.map((a) => polarToXY(cx, cy, labelR, a));

    return { gridPolys, dataPoints, axisPoints, labelPoints };
  }, [data, cx, cy, maxR, n]);

  const uid = color.replace("#", "r");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        {/* Gradient fill for data polygon */}
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
        {/* Glow filter for stroke */}
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Shadow for depth */}
        <filter id={`shadow-${uid}`} x="-10%" y="10%" width="120%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dy="6" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* ── Grid rings (depth layers) ── */}
      {gridPolys.map((pts, li) => {
        const isOuter = li === gridPolys.length - 1;
        return (
          <path
            key={li}
            d={toPath(pts)}
            fill={isOuter ? "rgba(0,184,145,0.03)" : "none"}
            stroke={isOuter ? `${color}35` : "#1e3058"}
            strokeWidth={isOuter ? 1.5 : 1}
            strokeDasharray={li < gridPolys.length - 1 ? "4 4" : "0"}
          />
        );
      })}

      {/* ── Axis spokes ── */}
      {axisPoints.map((pt, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={pt.x} y2={pt.y}
          stroke="#1e3058"
          strokeWidth={1}
        />
      ))}

      {/* ── Data polygon shadow (depth) ── */}
      <path
        d={toPath(dataPoints.map((p) => ({ x: p.x, y: p.y + 8 })))}
        fill={color}
        fillOpacity={0.08}
        stroke="none"
      />

      {/* ── Data polygon fill ── */}
      <path
        d={toPath(dataPoints)}
        fill={`url(#grad-${uid})`}
        stroke="none"
      />

      {/* ── Data polygon stroke (glowing) ── */}
      <path
        d={toPath(dataPoints)}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        filter={`url(#glow-${uid})`}
      />

      {/* ── Data points ── */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={7} fill={color} fillOpacity={0.12} />
          <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <circle cx={p.x} cy={p.y} r={1.5} fill="white" fillOpacity={0.8} />
        </g>
      ))}

      {/* ── Value labels on dots ── */}
      {dataPoints.map((p, i) => {
        const angle = (i / n) * 360 - 90;
        const rad = angle * (Math.PI / 180);
        const offset = 14;
        return (
          <text
            key={i}
            x={p.x + Math.cos(rad) * offset}
            y={p.y + Math.sin(rad) * offset}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={700}
            fill={color}
            opacity={0.9}
          >
            {data[i].value.toFixed(1)}
          </text>
        );
      })}

      {/* ── Axis labels ── */}
      {labelPoints.map((p, i) => {
        const angle = (i / n) * 360;
        let anchor: "middle" | "start" | "end" = "middle";
        if (angle > 15 && angle < 165) anchor = "start";
        else if (angle > 195 && angle < 345) anchor = "end";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="#64748b"
            letterSpacing="0.04em"
          >
            {data[i].subject}
          </text>
        );
      })}

      {/* ── Center dot ── */}
      <circle cx={cx} cy={cy} r={3} fill="#1e3058" />
    </svg>
  );
}
