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

/* Gekantelde projectie: y wordt geplet zodat de radar als een
   3D-platform op tafel lijkt te liggen. */
const TILT = 0.84;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) * TILT };
}

function toPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
}

function shade(points: { x: number; y: number }[], dy: number) {
  return points.map((p) => ({ x: p.x, y: p.y + dy }));
}

export function PlayerRadarChart({
  data,
  color = "#5A90BA",
  secondaryData,
  secondaryColor = "#3F7A5A",
  size = 280,
}: PlayerRadarChartProps) {
  const pad = 44;
  const cx = size / 2 + pad;
  const cy = size / 2 + pad;
  const svgW = size + pad * 2;
  const svgH = size + pad * 2;

  const maxR = (size / 2) * 0.68;
  const n = data.length;
  const levels = [0.25, 0.5, 0.75, 1.0];
  const DEPTH = 10;   // dikte van het platform
  const LIFT = 5;     // hoogte van het datavlak boven het platform

  const { gridPolys, dataPoints, secondaryPoints, labelPoints } = useMemo(() => {
    const angles = data.map((_, i) => (i / n) * 360);

    const gridPolys = levels.map((level) =>
      angles.map((a) => polarToXY(cx, cy, maxR * level, a))
    );

    const dataPoints = data.map((d, i) => {
      const val = Math.min(Math.max(d.value / (d.fullMark ?? 10), 0), 1);
      const p = polarToXY(cx, cy, maxR * val, angles[i]);
      return { x: p.x, y: p.y - LIFT };
    });

    const secondaryPoints = secondaryData?.map((d, i) => {
      const val = Math.min(Math.max(d.value / (d.fullMark ?? 10), 0), 1);
      const p = polarToXY(cx, cy, maxR * val, angles[i]);
      return { x: p.x, y: p.y - LIFT };
    });

    const labelR = maxR * 1.32;
    const labelPoints = angles.map((a) => polarToXY(cx, cy, labelR, a));

    return { gridPolys, dataPoints, secondaryPoints, labelPoints };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, secondaryData, cx, cy, maxR, n]);

  const uid = (color + (secondaryData ? "s" : "")).replace(/[^a-z0-9]/gi, "r");
  const outer = gridPolys[gridPolys.length - 1];

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ overflow: "visible", maxWidth: "100%" }}
    >
      <defs>
        {/* datavlak: licht bovenin → verzadigd onderin, glas-effect */}
        <linearGradient id={`rg-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="55%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`rg2-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.40" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.08" />
        </linearGradient>
        {/* platformbovenkant */}
        <radialGradient id={`plat-${uid}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.10" />
          <stop offset="70%" stopColor={color} stopOpacity="0.04" />
          <stop offset="100%" stopColor={color} stopOpacity="0.09" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={color} floodOpacity="0.28" />
        </filter>
      </defs>

      {/* ── Grondschaduw ── */}
      <ellipse
        cx={cx} cy={cy + DEPTH + maxR * TILT * 0.92}
        rx={maxR * 0.92} ry={maxR * TILT * 0.22}
        fill="rgba(15,23,42,0.10)"
      />

      {/* ── Platform-zijkant (extrusie) ── */}
      <path d={toPath(shade(outer, DEPTH))} fill={`${color}26`} />
      {outer.map((p, i) => {
        const q = outer[(i + 1) % outer.length];
        // alleen de naar voren gerichte wanden tekenen
        if ((p.y + q.y) / 2 < cy) return null;
        return (
          <path
            key={`wall-${i}`}
            d={`M${p.x},${p.y} L${q.x},${q.y} L${q.x},${q.y + DEPTH} L${p.x},${p.y + DEPTH} Z`}
            fill={`${color}33`}
          />
        );
      })}

      {/* ── Platform-bovenkant ── */}
      <path d={toPath(outer)} fill={`url(#plat-${uid})`} stroke={`${color}55`} strokeWidth={1.2} />

      {/* ── Binnenringen — strak, geen stippellijn ── */}
      {gridPolys.slice(0, -1).map((pts, li) => (
        <path
          key={`grid-${li}`}
          d={toPath(pts)}
          fill="none"
          stroke={`${color}2E`}
          strokeWidth={1}
        />
      ))}

      {/* ── Spaken ── */}
      {outer.map((pt, i) => (
        <line key={`axis-${i}`}
          x1={cx} y1={cy}
          x2={pt.x} y2={pt.y}
          stroke={`${color}24`}
          strokeWidth={1}
        />
      ))}

      {/* ── Niveaulabels ── */}
      {levels.slice(0, -1).map((level, li) => {
        const pt = polarToXY(cx, cy, maxR * level, 0);
        return (
          <text key={`lvl-${li}`}
            x={pt.x + 4} y={pt.y}
            fontSize={7.5} fill="var(--text-dim)" fontWeight={500}
            dominantBaseline="middle" textAnchor="start">
            {Math.round(level * 10)}
          </text>
        );
      })}

      {/* ── Vergelijkingsvlak (bijv. teamgemiddelde) ── */}
      {secondaryPoints && (
        <>
          <path
            d={toPath(secondaryPoints)}
            fill={`url(#rg2-${uid})`}
            stroke={secondaryColor}
            strokeWidth={1.8}
            strokeLinejoin="round"
            opacity={0.9}
          />
          {secondaryPoints.map((p, i) => (
            <circle key={`s-dot-${i}`} cx={p.x} cy={p.y} r={3} fill={secondaryColor} />
          ))}
        </>
      )}

      {/* ── Datavlak: dikte + bovenvlak ── */}
      <path d={toPath(shade(dataPoints, LIFT + 2))} fill={color} fillOpacity={0.22} />
      <path
        d={toPath(dataPoints)}
        fill={`url(#rg-${uid})`}
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
        filter={`url(#soft-${uid})`}
      />
      {/* glans langs de bovenrand */}
      <path
        d={toPath(dataPoints)}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* ── Datapunten ── */}
      {dataPoints.map((p, i) => (
        <g key={`dp-${i}`}>
          <circle cx={p.x} cy={p.y} r={4.5} fill={color} />
          <circle cx={p.x} cy={p.y} r={1.8} fill="#fff" />
        </g>
      ))}

      {/* ── As-labels ── */}
      {labelPoints.map((p, i) => {
        const label = data[i].subject;
        const labelW = Math.max(label.length * 7 + 16, 40);
        return (
          <g key={`lbl-${i}`}>
            <rect
              x={p.x - labelW / 2}
              y={p.y - 10}
              width={labelW}
              height={20}
              rx={10}
              fill="var(--surface, #fff)"
              stroke="var(--border, #E5E7EB)"
              strokeWidth={1}
            />
            <text
              x={p.x}
              y={p.y + 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={600}
              fill="var(--text, #1F2937)"
              letterSpacing="0.01em"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
