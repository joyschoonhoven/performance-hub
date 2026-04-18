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
  secondaryData?: RadarData[];
  secondaryColor?: string;
  size?: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
}

export function PlayerRadarChart({
  data,
  color = "#4FA9E6",
  secondaryData,
  secondaryColor = "#10b981",
  size = 280,
}: PlayerRadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.65;
  const n = data.length;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const { gridPolys, dataPoints, secondaryPoints, axisPoints, labelPoints } = useMemo(() => {
    const angles = data.map((_, i) => (i / n) * 360);

    const gridPolys = levels.map((level) =>
      angles.map((a) => polarToXY(cx, cy, maxR * level, a))
    );

    const dataPoints = data.map((d, i) => {
      const val = Math.min(Math.max(d.value / (d.fullMark ?? 10), 0), 1);
      return polarToXY(cx, cy, maxR * val, angles[i]);
    });

    const secondaryPoints = secondaryData?.map((d, i) => {
      const val = Math.min(Math.max(d.value / (d.fullMark ?? 10), 0), 1);
      return polarToXY(cx, cy, maxR * val, angles[i]);
    });

    const axisPoints = angles.map((a) => polarToXY(cx, cy, maxR, a));
    const labelR = maxR * 1.28;
    const labelPoints = angles.map((a) => polarToXY(cx, cy, labelR, a));

    return { gridPolys, dataPoints, secondaryPoints, axisPoints, labelPoints };
  }, [data, secondaryData, cx, cy, maxR, n]);

  const uid = color.replace(/[^a-z0-9]/gi, "r");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        {/* Primary fill gradient */}
        <linearGradient id={`rg-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
        {/* Secondary fill gradient */}
        <linearGradient id={`rg2-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.06" />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`rglow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Soft drop shadow */}
        <filter id={`rdrop-${uid}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={color} floodOpacity="0.2" />
        </filter>
      </defs>

      {/* ── Filled background rings ── */}
      {gridPolys.map((pts, li) => (
        <path
          key={`bg-${li}`}
          d={toPath(pts)}
          fill={li === gridPolys.length - 1
            ? `${color}05`
            : li % 2 === 0 ? "rgba(244,245,247,0.8)" : "rgba(255,255,255,0.6)"
          }
          stroke="none"
        />
      ))}

      {/* ── Grid ring outlines ── */}
      {gridPolys.map((pts, li) => (
        <path
          key={`grid-${li}`}
          d={toPath(pts)}
          fill="none"
          stroke={li === gridPolys.length - 1 ? `${color}40` : "#E4E7EB"}
          strokeWidth={li === gridPolys.length - 1 ? 1.5 : 1}
          strokeDasharray={li < gridPolys.length - 1 ? "3 4" : undefined}
        />
      ))}

      {/* ── Level number labels (inner rings) ── */}
      {levels.slice(0, -1).map((level, li) => {
        const pt = polarToXY(cx, cy, maxR * level, 0);
        return (
          <text key={`lvl-${li}`}
            x={pt.x + 3} y={pt.y}
            fontSize={7} fill="#9CA3AF" fontWeight={500}
            dominantBaseline="middle" textAnchor="start">
            {Math.round(level * 10)}
          </text>
        );
      })}

      {/* ── Axis spokes ── */}
      {axisPoints.map((pt, i) => (
        <line key={`axis-${i}`}
          x1={cx} y1={cy}
          x2={pt.x} y2={pt.y}
          stroke="#D1D5DB"
          strokeWidth={1}
        />
      ))}

      {/* ── Secondary data polygon (comparison) ── */}
      {secondaryPoints && (
        <>
          <path
            d={toPath(secondaryPoints)}
            fill={`url(#rg2-${uid})`}
            stroke={secondaryColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray="5 3"
            opacity={0.85}
          />
          {secondaryPoints.map((p, i) => (
            <circle key={`s-dot-${i}`} cx={p.x} cy={p.y} r={3.5}
              fill={secondaryColor} fillOpacity={0.8} />
          ))}
        </>
      )}

      {/* ── Primary data polygon shadow ── */}
      <path
        d={toPath(dataPoints.map((p) => ({ x: p.x, y: p.y + 5 })))}
        fill={color}
        fillOpacity={0.06}
        stroke="none"
      />

      {/* ── Primary data polygon fill ── */}
      <path
        d={toPath(dataPoints)}
        fill={`url(#rg-${uid})`}
        stroke="none"
      />

      {/* ── Primary data polygon stroke (glowing) ── */}
      <path
        d={toPath(dataPoints)}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        filter={`url(#rglow-${uid})`}
      />

      {/* ── Data points with value bubbles ── */}
      {dataPoints.map((p, i) => {
        const angle = (i / n) * 360 - 90;
        const rad = angle * (Math.PI / 180);
        const offset = 15;
        const val = data[i].value;

        return (
          <g key={`dp-${i}`}>
            {/* Outer glow ring */}
            <circle cx={p.x} cy={p.y} r={9} fill={color} fillOpacity={0.12} />
            {/* Main dot */}
            <circle cx={p.x} cy={p.y} r={5} fill={color}
              filter={`url(#rdrop-${uid})`} />
            {/* Inner white */}
            <circle cx={p.x} cy={p.y} r={2} fill="white" fillOpacity={0.9} />

            {/* Value pill */}
            <g transform={`translate(${p.x + Math.cos(rad) * offset}, ${p.y + Math.sin(rad) * offset})`}>
              <rect x={-12} y={-8} width={24} height={16} rx={8}
                fill={color} fillOpacity={0.92} />
              <text x={0} y={0}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fontWeight={800} fill="white">
                {val.toFixed(1)}
              </text>
            </g>
          </g>
        );
      })}

      {/* ── Axis labels with pill backgrounds ── */}
      {labelPoints.map((p, i) => {
        const angle = (i / n) * 360;
        let anchor: "middle" | "start" | "end" = "middle";
        if (angle > 20 && angle < 160) anchor = "start";
        else if (angle > 200 && angle < 340) anchor = "end";

        const label = data[i].subject;
        const labelW = label.length * 6 + 12;

        return (
          <g key={`lbl-${i}`}>
            <rect
              x={anchor === "start" ? p.x - 2 : anchor === "end" ? p.x - labelW + 2 : p.x - labelW / 2}
              y={p.y - 9}
              width={labelW}
              height={18}
              rx={9}
              fill="white"
              stroke="#E4E7EB"
              strokeWidth={1}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={700}
              fill="#374151"
              letterSpacing="0.03em"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Center dot ── */}
      <circle cx={cx} cy={cy} r={4} fill={color} fillOpacity={0.3} />
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </svg>
  );
}
