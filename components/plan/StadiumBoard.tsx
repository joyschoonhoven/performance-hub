"use client";

import { useMemo } from "react";
import { CATEGORY_META, type PlanAgreement, type PlanCategory } from "@/lib/personal-plan";
import { Clock, CheckCircle2, Flame, AlarmClock, Plus, Lock } from "lucide-react";

interface StadiumBoardProps {
  agreements: PlanAgreement[];
  canEdit?: boolean;
  onAdd?: (category: PlanCategory) => void;
  onSelect?: (a: PlanAgreement) => void;
}

const ZONE_ORDER: PlanCategory[] = ["tactical", "technical", "mental"];

function statusColor(status: PlanAgreement["status"]) {
  switch (status) {
    case "completed":   return "#16A34A";
    case "in_progress": return "#4DAEE5";
    case "missed":      return "#D64045";
    default:            return "#94a3b8";
  }
}

function statusLabel(status: PlanAgreement["status"]) {
  switch (status) {
    case "completed":   return "Behaald";
    case "in_progress": return "Bezig";
    case "missed":      return "Gemist";
    default:            return "Open";
  }
}

function deadlineHint(deadline?: string | null) {
  if (!deadline) return null;
  const days = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return { text: `${Math.abs(days)}d te laat`, urgent: true };
  if (days === 0) return { text: "vandaag", urgent: true };
  if (days === 1) return { text: "morgen", urgent: true };
  if (days <= 7) return { text: `${days}d resterend`, urgent: false };
  return { text: new Date(deadline).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }), urgent: false };
}

function AgreementCardMini({
  a,
  onClick,
}: {
  a: PlanAgreement;
  onClick?: () => void;
}) {
  const meta = CATEGORY_META[a.category];
  const sColor = statusColor(a.status);
  const dl = deadlineHint(a.deadline);
  const done = a.status === "completed";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 12px",
        borderRadius: 12,
        background: done
          ? "linear-gradient(135deg, rgba(22,163,74,0.18), rgba(22,163,74,0.06))"
          : "rgba(7,16,26,0.78)",
        border: `1px solid ${done ? "rgba(22,163,74,0.45)" : "rgba(255,255,255,0.14)"}`,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        cursor: onClick ? "pointer" : "default",
        backdropFilter: "blur(6px)",
        width: "100%",
        color: "#fff",
        transition: "transform 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = meta.color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = done
          ? "rgba(22,163,74,0.45)"
          : "rgba(255,255,255,0.14)";
      }}
    >
      {/* Header: icon + status pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: meta.accent,
            color: meta.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            border: `1px solid ${meta.color}66`,
          }}
        >
          {meta.icon}
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: sColor,
            background: `${sColor}1f`,
            padding: "2px 6px",
            borderRadius: 4,
            border: `1px solid ${sColor}55`,
          }}
        >
          {statusLabel(a.status)}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.3,
          color: "#fff",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {a.title}
      </div>

      {/* Footer: streak + deadline + xp */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
        {(a.streak ?? 0) > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#F0A500" }}>
            <Flame size={10} /> {a.streak}
          </span>
        )}
        {dl && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: dl.urgent && !done ? "#F0A500" : "rgba(255,255,255,0.7)",
            }}
          >
            <Clock size={10} /> {dl.text}
          </span>
        )}
        {done && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#16A34A" }}>
            <CheckCircle2 size={10} />
          </span>
        )}
        <span style={{ marginLeft: "auto", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
          +{a.xp ?? 0} XP
        </span>
      </div>
    </button>
  );
}

function Zone({
  category,
  agreements,
  canEdit,
  onAdd,
  onSelect,
}: {
  category: PlanCategory;
  agreements: PlanAgreement[];
  canEdit?: boolean;
  onAdd?: (c: PlanCategory) => void;
  onSelect?: (a: PlanAgreement) => void;
}) {
  const meta = CATEGORY_META[category];
  const completed = agreements.filter((a) => a.status === "completed").length;
  const total = agreements.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: 220,
        padding: "18px 18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        // Subtle zone wash so each third reads differently
        background: `linear-gradient(180deg, ${meta.color}10 0%, transparent 100%)`,
      }}
    >
      {/* Zone header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            background: meta.accent,
            color: meta.color,
            border: `1px solid ${meta.color}55`,
          }}
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            {meta.zoneLabel}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
            {meta.label}
          </div>
        </div>

        {/* Progress pill */}
        <div
          style={{
            background: "rgba(7,16,26,0.65)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 999,
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: "rgba(255,255,255,0.16)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: meta.color,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontWeight: 700, color: meta.color, minWidth: 28, textAlign: "right" }}>
            {completed}/{total}
          </span>
        </div>

        {canEdit && onAdd && (
          <button
            type="button"
            onClick={() => onAdd(category)}
            title={`Voeg ${meta.label.toLowerCase()} afspraak toe`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: meta.color,
              color: "#0D1B2A",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: `0 0 0 4px ${meta.color}26`,
            }}
          >
            <Plus size={15} />
          </button>
        )}
      </div>

      {/* Agreements grid */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {agreements.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              padding: "18px 14px",
              borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.18)",
              textAlign: "center",
              color: "rgba(255,255,255,0.55)",
              fontSize: 12,
              background: "rgba(7,16,26,0.35)",
            }}
          >
            {canEdit ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={12} /> Voeg de eerste {meta.label.toLowerCase()} afspraak toe
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Lock size={12} /> Nog geen afspraken in deze zone
              </span>
            )}
          </div>
        ) : (
          agreements.map((a) => (
            <AgreementCardMini key={a.id} a={a} onClick={() => onSelect?.(a)} />
          ))
        )}
      </div>
    </div>
  );
}

export function StadiumBoard({ agreements, canEdit, onAdd, onSelect }: StadiumBoardProps) {
  const byZone = useMemo(() => {
    const map: Record<PlanCategory, PlanAgreement[]> = { tactical: [], technical: [], mental: [] };
    agreements.forEach((a) => map[a.category].push(a));
    return map;
  }, [agreements]);

  const upcomingDeadline = useMemo(() => {
    const future = agreements
      .filter((a) => a.deadline && a.status !== "completed")
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    return future[0];
  }, [agreements]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        // Stadium turf — green gradient with stripes
        background:
          "repeating-linear-gradient(90deg, #146e3a 0 60px, #1a7d42 60px 120px), linear-gradient(180deg, #0D1B2A 0%, #07101A 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.35)",
        border: "1px solid rgba(77,174,229,0.18)",
      }}
    >
      {/* Top deadline ticker */}
      {upcomingDeadline && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: "rgba(7,16,26,0.78)",
            border: "1px solid rgba(240,165,0,0.4)",
            borderRadius: 999,
            backdropFilter: "blur(6px)",
            color: "#fff",
            fontSize: 12,
          }}
        >
          <AlarmClock size={14} style={{ color: "#F0A500" }} />
          <span style={{ fontWeight: 700, color: "#F0A500" }}>Volgende deadline:</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {upcomingDeadline.title}
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)" }}>
            {deadlineHint(upcomingDeadline.deadline)?.text}
          </span>
        </div>
      )}

      {/* Field lines overlay (SVG) */}
      <svg
        viewBox="0 0 400 600"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.32,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {/* Outer line */}
        <rect x="8" y="8" width="384" height="584" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        {/* Center line */}
        <line x1="8" y1="300" x2="392" y2="300" stroke="#ffffff" strokeWidth="1.2" />
        {/* Center circle */}
        <circle cx="200" cy="300" r="56" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="200" cy="300" r="2" fill="#ffffff" />
        {/* Top penalty box (attack zone) */}
        <rect x="100" y="8" width="200" height="64" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        <rect x="148" y="8" width="104" height="22" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        {/* Bottom penalty box (defense zone) */}
        <rect x="100" y="528" width="200" height="64" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        <rect x="148" y="570" width="104" height="22" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        {/* Penalty spots */}
        <circle cx="200" cy="50" r="2" fill="#ffffff" />
        <circle cx="200" cy="550" r="2" fill="#ffffff" />
      </svg>

      {/* Zone stack */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          paddingTop: upcomingDeadline ? 56 : 14,
        }}
      >
        {ZONE_ORDER.map((cat, i) => (
          <div key={cat}>
            <Zone
              category={cat}
              agreements={byZone[cat]}
              canEdit={canEdit}
              onAdd={onAdd}
              onSelect={onSelect}
            />
            {i < ZONE_ORDER.length - 1 && (
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  margin: "0 28px",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
