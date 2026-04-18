"use client";

import { useState } from "react";

export type BodyRegion =
  | "head" | "neck"
  | "left_shoulder" | "right_shoulder"
  | "left_arm" | "right_arm"
  | "left_forearm" | "right_forearm"
  | "chest" | "abdomen"
  | "left_hip" | "right_hip"
  | "left_thigh" | "right_thigh"
  | "left_hamstring" | "right_hamstring"
  | "left_knee" | "right_knee"
  | "left_calf" | "right_calf"
  | "left_ankle" | "right_ankle"
  | "left_foot" | "right_foot";

export type DominantFoot = "left" | "right" | "both";

interface InjuryBodyMapProps {
  injuries: BodyRegion[];
  dominantFoot: DominantFoot;
  onInjuriesChange?: (injuries: BodyRegion[]) => void;
  onDominantFootChange?: (foot: DominantFoot) => void;
  readonly?: boolean;
}

const REGION_LABELS: Record<BodyRegion, string> = {
  head: "Hoofd",
  neck: "Nek",
  left_shoulder: "Linkerschouder",
  right_shoulder: "Rechterschouder",
  left_arm: "Linker bovenarm",
  right_arm: "Rechter bovenarm",
  left_forearm: "Linker onderarm",
  right_forearm: "Rechter onderarm",
  chest: "Borst",
  abdomen: "Buik",
  left_hip: "Linkerheup",
  right_hip: "Rechterheup",
  left_thigh: "Linker bovenbeen",
  right_thigh: "Rechter bovenbeen",
  left_hamstring: "Linker hamstring",
  right_hamstring: "Rechter hamstring",
  left_knee: "Linker knie",
  right_knee: "Rechter knie",
  left_calf: "Linker kuit",
  right_calf: "Rechter kuit",
  left_ankle: "Linker enkel",
  right_ankle: "Rechter enkel",
  left_foot: "Linkerbeen",
  right_foot: "Rechterbeen",
};

// SVG path data for each body region (simplified body outline, 200x440 viewBox)
// Each shape is a clickable region on the body
const BODY_REGIONS: { id: BodyRegion; path: string; cx: number; cy: number; r: number }[] = [
  // Head
  { id: "head", path: "M100,20 a24,24 0 1,0 0.01,0 Z", cx: 100, cy: 20, r: 18 },
  // Neck
  { id: "neck", path: "M92,44 h16 v14 h-16 Z", cx: 100, cy: 51, r: 8 },
  // Left shoulder (appears on right in mirror)
  { id: "right_shoulder", path: "M116,58 q18,-4 22,8 l-4,12 q-12,-6 -18,-8 Z", cx: 130, cy: 68, r: 10 },
  // Right shoulder (appears on left in mirror)
  { id: "left_shoulder", path: "M84,58 q-18,-4 -22,8 l4,12 q12,-6 18,-8 Z", cx: 70, cy: 68, r: 10 },
  // Chest
  { id: "chest", path: "M84,62 h32 l4,30 h-40 Z", cx: 100, cy: 77, r: 16 },
  // Abdomen
  { id: "abdomen", path: "M80,92 h40 l2,28 h-44 Z", cx: 100, cy: 106, r: 14 },
  // Left arm (appears on right)
  { id: "right_arm", path: "M136,80 q8,2 10,16 l-6,16 q-10,-4 -12,-20 Z", cx: 138, cy: 98, r: 9 },
  // Right arm (appears on left)
  { id: "left_arm", path: "M64,80 q-8,2 -10,16 l6,16 q10,-4 12,-20 Z", cx: 62, cy: 98, r: 9 },
  // Left forearm (appears on right)
  { id: "right_forearm", path: "M140,112 q8,2 8,18 l-6,12 q-8,-6 -8,-20 Z", cx: 140, cy: 128, r: 9 },
  // Right forearm (appears on left)
  { id: "left_forearm", path: "M60,112 q-8,2 -8,18 l6,12 q8,-6 8,-20 Z", cx: 60, cy: 128, r: 9 },
  // Left hip (appears on right)
  { id: "right_hip", path: "M100,120 h24 l2,22 h-22 Z", cx: 113, cy: 131, r: 10 },
  // Right hip (appears on left)
  { id: "left_hip", path: "M76,120 h24 l-4,22 h-22 Z", cx: 87, cy: 131, r: 10 },
  // Left thigh (appears on right)
  { id: "right_thigh", path: "M102,142 h20 l-2,38 h-20 Z", cx: 112, cy: 161, r: 12 },
  // Right thigh (appears on left)
  { id: "left_thigh", path: "M78,142 h20 l2,38 h-20 Z", cx: 88, cy: 161, r: 12 },
  // Left knee (appears on right)
  { id: "right_knee", path: "M100,180 h22 v14 h-22 Z", cx: 111, cy: 187, r: 8 },
  // Right knee (appears on left)
  { id: "left_knee", path: "M78,180 h22 v14 h-22 Z", cx: 89, cy: 187, r: 8 },
  // Left calf (appears on right)
  { id: "right_calf", path: "M101,194 h20 l-2,44 h-18 Z", cx: 111, cy: 216, r: 12 },
  // Right calf (appears on left)
  { id: "left_calf", path: "M79,194 h20 l2,44 h-18 Z", cx: 89, cy: 216, r: 12 },
  // Left ankle/foot (appears on right)
  { id: "right_ankle", path: "M100,238 h20 v12 h-20 Z", cx: 110, cy: 244, r: 7 },
  { id: "right_foot", path: "M98,250 h24 v10 l-8,4 h-16 Z", cx: 110, cy: 258, r: 8 },
  // Right ankle/foot (appears on left)
  { id: "left_ankle", path: "M80,238 h20 v12 h-20 Z", cx: 90, cy: 244, r: 7 },
  { id: "left_foot", path: "M78,250 h24 v10 l-16,4 h-8 Z", cx: 90, cy: 258, r: 8 },
  // Back side - hamstrings (shown with label override via circles)
  { id: "left_hamstring", path: "", cx: 88, cy: 172, r: 0 },
  { id: "right_hamstring", path: "", cx: 112, cy: 172, r: 0 },
];

const FOOT_REGIONS: BodyRegion[] = ["left_foot", "right_foot", "left_ankle", "right_ankle", "left_calf", "right_calf"];
const LEFT_REGIONS: BodyRegion[] = ["left_shoulder", "left_arm", "left_forearm", "left_hip", "left_thigh", "left_hamstring", "left_knee", "left_calf", "left_ankle", "left_foot"];
const RIGHT_REGIONS: BodyRegion[] = ["right_shoulder", "right_arm", "right_forearm", "right_hip", "right_thigh", "right_hamstring", "right_knee", "right_calf", "right_ankle", "right_foot"];

function isDominantFootRegion(region: BodyRegion, dominantFoot: DominantFoot): boolean {
  if (dominantFoot === "both") return FOOT_REGIONS.includes(region);
  if (dominantFoot === "left") return ["left_foot", "left_ankle", "left_calf"].includes(region);
  if (dominantFoot === "right") return ["right_foot", "right_ankle", "right_calf"].includes(region);
  return false;
}

export function InjuryBodyMap({
  injuries,
  dominantFoot,
  onInjuriesChange,
  onDominantFootChange,
  readonly = false,
}: InjuryBodyMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);

  function toggleInjury(region: BodyRegion) {
    if (readonly || !onInjuriesChange) return;
    if (injuries.includes(region)) {
      onInjuriesChange(injuries.filter((r) => r !== region));
    } else {
      onInjuriesChange([...injuries, region]);
    }
  }

  function getRegionFill(region: BodyRegion): string {
    if (injuries.includes(region)) return "rgba(239,68,68,0.7)";
    if (isDominantFootRegion(region, dominantFoot)) return "rgba(79,169,230,0.55)";
    if (hoveredRegion === region && !readonly) return "rgba(79,169,230,0.2)";
    return "rgba(148,163,184,0.18)";
  }

  function getRegionStroke(region: BodyRegion): string {
    if (injuries.includes(region)) return "#dc2626";
    if (isDominantFootRegion(region, dominantFoot)) return "#4FA9E6";
    if (hoveredRegion === region && !readonly) return "#4FA9E6";
    return "#cbd5e1";
  }

  const activeInjuries = injuries.map((r) => REGION_LABELS[r]);

  return (
    <div className="space-y-4">
      {/* Dominant foot toggle */}
      {!readonly && onDominantFootChange && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sterkste been:</span>
          <div className="flex gap-1.5">
            {(["left", "right", "both"] as DominantFoot[]).map((foot) => (
              <button
                key={foot}
                onClick={() => onDominantFootChange(foot)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={dominantFoot === foot
                  ? { background: "#4FA9E6", color: "#fff", boxShadow: "0 2px 8px rgba(79,169,230,0.3)" }
                  : { background: "#F4F5F7", color: "#64748b", border: "1px solid #E4E7EB" }
                }
              >
                {foot === "left" ? "Links" : foot === "right" ? "Rechts" : "Beide"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start flex-wrap">
        {/* SVG Body */}
        <div className="flex-shrink-0 relative">
          {!readonly && (
            <div className="text-[10px] text-slate-400 mb-2 text-center uppercase tracking-wider">
              Klik op lichaamsdeel voor blessure
            </div>
          )}
          <svg
            width={200}
            height={280}
            viewBox="0 0 200 280"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
            </defs>

            {/* Body silhouette background */}
            <ellipse cx={100} cy={20} rx={18} ry={20} fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Neck */}
            <rect x={92} y={38} width={16} height={14} rx={4} fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Torso */}
            <path d="M76,52 C62,58 54,72 56,90 L58,124 C58,132 68,138 78,138 L122,138 C132,138 142,132 142,124 L144,90 C146,72 138,58 124,52 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left upper arm */}
            <path d="M76,56 C64,58 56,70 56,84 L58,108 L72,104 L74,76 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left forearm */}
            <path d="M58,108 C54,118 52,130 56,144 L68,148 L72,124 L72,104 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right upper arm */}
            <path d="M124,56 C136,58 144,70 144,84 L142,108 L128,104 L126,76 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right forearm */}
            <path d="M142,108 C146,118 148,130 144,144 L132,148 L128,124 L128,104 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left leg upper */}
            <path d="M80,138 L100,140 L96,186 L74,182 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right leg upper */}
            <path d="M120,138 L100,140 L104,186 L126,182 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left knee */}
            <ellipse cx={85} cy={188} rx={12} ry={8} fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right knee */}
            <ellipse cx={115} cy={188} rx={12} ry={8} fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left calf */}
            <path d="M74,196 L96,196 L92,242 L70,238 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right calf */}
            <path d="M104,196 L126,196 L130,238 L108,242 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Left foot */}
            <path d="M70,240 L92,242 L90,258 L64,258 L62,252 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />
            {/* Right foot */}
            <path d="M108,242 L130,240 L138,252 L136,258 L110,258 Z"
              fill="url(#bodyGrad)" stroke="#e2e8f0" strokeWidth={1} />

            {/* Clickable regions */}
            {/* Head */}
            <ellipse cx={100} cy={20} rx={18} ry={20}
              fill={getRegionFill("head")} stroke={getRegionStroke("head")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("head")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("head")} />

            {/* Neck */}
            <rect x={92} y={38} width={16} height={14} rx={4}
              fill={getRegionFill("neck")} stroke={getRegionStroke("neck")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("neck")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("neck")} />

            {/* Left shoulder (right side of body) */}
            <ellipse cx={70} cy={62} rx={14} ry={10}
              fill={getRegionFill("left_shoulder")} stroke={getRegionStroke("left_shoulder")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_shoulder")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_shoulder")} />

            {/* Right shoulder (left side of body) */}
            <ellipse cx={130} cy={62} rx={14} ry={10}
              fill={getRegionFill("right_shoulder")} stroke={getRegionStroke("right_shoulder")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_shoulder")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_shoulder")} />

            {/* Chest */}
            <ellipse cx={100} cy={82} rx={20} ry={16}
              fill={getRegionFill("chest")} stroke={getRegionStroke("chest")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("chest")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("chest")} />

            {/* Abdomen */}
            <ellipse cx={100} cy={112} rx={18} ry={14}
              fill={getRegionFill("abdomen")} stroke={getRegionStroke("abdomen")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("abdomen")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("abdomen")} />

            {/* Left arm */}
            <ellipse cx={62} cy={84} rx={9} ry={14}
              fill={getRegionFill("left_arm")} stroke={getRegionStroke("left_arm")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_arm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_arm")} />

            {/* Right arm */}
            <ellipse cx={138} cy={84} rx={9} ry={14}
              fill={getRegionFill("right_arm")} stroke={getRegionStroke("right_arm")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_arm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_arm")} />

            {/* Left forearm */}
            <ellipse cx={58} cy={122} rx={8} ry={14}
              fill={getRegionFill("left_forearm")} stroke={getRegionStroke("left_forearm")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_forearm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_forearm")} />

            {/* Right forearm */}
            <ellipse cx={142} cy={122} rx={8} ry={14}
              fill={getRegionFill("right_forearm")} stroke={getRegionStroke("right_forearm")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_forearm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_forearm")} />

            {/* Left hip */}
            <ellipse cx={85} cy={140} rx={12} ry={10}
              fill={getRegionFill("left_hip")} stroke={getRegionStroke("left_hip")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_hip")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_hip")} />

            {/* Right hip */}
            <ellipse cx={115} cy={140} rx={12} ry={10}
              fill={getRegionFill("right_hip")} stroke={getRegionStroke("right_hip")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_hip")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_hip")} />

            {/* Left thigh */}
            <ellipse cx={84} cy={164} rx={12} ry={18}
              fill={getRegionFill("left_thigh")} stroke={getRegionStroke("left_thigh")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_thigh")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_thigh")} />

            {/* Right thigh */}
            <ellipse cx={116} cy={164} rx={12} ry={18}
              fill={getRegionFill("right_thigh")} stroke={getRegionStroke("right_thigh")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_thigh")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_thigh")} />

            {/* Left knee */}
            <ellipse cx={85} cy={188} rx={11} ry={8}
              fill={getRegionFill("left_knee")} stroke={getRegionStroke("left_knee")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_knee")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_knee")} />

            {/* Right knee */}
            <ellipse cx={115} cy={188} rx={11} ry={8}
              fill={getRegionFill("right_knee")} stroke={getRegionStroke("right_knee")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_knee")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_knee")} />

            {/* Left calf */}
            <ellipse cx={83} cy={218} rx={10} ry={18}
              fill={getRegionFill("left_calf")} stroke={getRegionStroke("left_calf")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_calf")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_calf")} />

            {/* Right calf */}
            <ellipse cx={117} cy={218} rx={10} ry={18}
              fill={getRegionFill("right_calf")} stroke={getRegionStroke("right_calf")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_calf")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_calf")} />

            {/* Left ankle */}
            <ellipse cx={83} cy={241} rx={9} ry={7}
              fill={getRegionFill("left_ankle")} stroke={getRegionStroke("left_ankle")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_ankle")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_ankle")} />

            {/* Right ankle */}
            <ellipse cx={117} cy={241} rx={9} ry={7}
              fill={getRegionFill("right_ankle")} stroke={getRegionStroke("right_ankle")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_ankle")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_ankle")} />

            {/* Left foot */}
            <ellipse cx={78} cy={255} rx={16} ry={8}
              fill={getRegionFill("left_foot")} stroke={getRegionStroke("left_foot")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("left_foot")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("left_foot")} />

            {/* Right foot */}
            <ellipse cx={122} cy={255} rx={16} ry={8}
              fill={getRegionFill("right_foot")} stroke={getRegionStroke("right_foot")} strokeWidth={1.5}
              style={{ cursor: readonly ? "default" : "pointer", transition: "fill 0.15s" }}
              onMouseEnter={() => setHoveredRegion("right_foot")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => toggleInjury("right_foot")} />

            {/* Hover tooltip */}
            {hoveredRegion && (
              <text x={100} y={275} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600}>
                {REGION_LABELS[hoveredRegion]}
              </text>
            )}
          </svg>
        </div>

        {/* Legend + active injuries */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ background: "rgba(79,169,230,0.55)", border: "1.5px solid #4FA9E6" }} />
              <span className="text-xs text-slate-700 font-medium">
                Sterkste been ({dominantFoot === "left" ? "Links" : dominantFoot === "right" ? "Rechts" : "Beide"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ background: "rgba(239,68,68,0.7)", border: "1.5px solid #dc2626" }} />
              <span className="text-xs text-slate-700 font-medium">Blessure / pijn</span>
            </div>
          </div>

          {/* Active injuries list */}
          {activeInjuries.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Actieve blessures ({activeInjuries.length})
              </div>
              <div className="space-y-1.5">
                {injuries.map((r) => (
                  <div key={r} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <span className="text-xs text-slate-700">{REGION_LABELS[r]}</span>
                    {!readonly && onInjuriesChange && (
                      <button
                        onClick={() => toggleInjury(r)}
                        className="text-red-400 hover:text-red-600 text-[10px] font-bold transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeInjuries.length === 0 && (
            <div className="text-xs text-slate-400 italic">
              {readonly ? "Geen blessures geregistreerd." : "Klik op een lichaamsdeel om een blessure te markeren."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
