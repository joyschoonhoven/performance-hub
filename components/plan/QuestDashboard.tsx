"use client";

import { useMemo } from "react";
import {
  CATEGORY_META,
  type PlanAgreement,
  type PlanCategory,
  type PlanStatus,
} from "@/lib/personal-plan";
import {
  Flame, Trophy, CheckCircle2, Clock, Plus, Sparkles, Calendar,
  Lock,
} from "lucide-react";

interface Props {
  agreements: PlanAgreement[];
  canEdit?: boolean;
  /** Active category filter ("all" or one of the three categories) */
  filter: "all" | PlanCategory;
  onFilterChange: (f: "all" | PlanCategory) => void;
  onAdd?: (category?: PlanCategory) => void;
  onSelect?: (a: PlanAgreement) => void;
  onQuickComplete?: (id: string) => void;
}

const LEVEL_XP = 1000;

const LEVEL_TIERS: { min: number; title: string; color: string }[] = [
  { min: 1,  title: "Rookie",     color: "#94a3b8" },
  { min: 4,  title: "Talent",     color: "#4DAEE5" },
  { min: 8,  title: "Pro",        color: "#16A34A" },
  { min: 12, title: "Elite",      color: "#F0A500" },
  { min: 18, title: "Legend",     color: "#D64045" },
];

function tierFor(level: number) {
  return [...LEVEL_TIERS].reverse().find((t) => level >= t.min) ?? LEVEL_TIERS[0];
}

function deadlineBucket(deadline: string | null | undefined): "today" | "tomorrow" | "thisWeek" | "later" | "overdue" | "noDeadline" {
  if (!deadline) return "noDeadline";
  const now = new Date();
  const d = new Date(deadline);
  // Normalize to midnight for day-level diff
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((d.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "thisWeek";
  return "later";
}

function deadlineLabel(deadline: string | null | undefined) {
  if (!deadline) return "geen deadline";
  const now = new Date();
  const d = new Date(deadline);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((d.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)} dag${Math.abs(days) === 1 ? "" : "en"} te laat`;
  if (days === 0) return "vandaag";
  if (days === 1) return "morgen";
  if (days <= 7) return `over ${days} dagen`;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

interface MissionCardProps {
  a: PlanAgreement;
  canEdit?: boolean;
  onClick?: () => void;
  onQuickComplete?: () => void;
}

function MissionCard({ a, canEdit, onClick, onQuickComplete }: MissionCardProps) {
  const meta = CATEGORY_META[a.category];
  const done = a.status === "completed";
  const bucket = deadlineBucket(a.deadline);
  const urgent = bucket === "overdue" || bucket === "today" || bucket === "tomorrow";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className="py-2.5 px-2.5 sm:py-3 sm:px-3.5"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 12,
        background: done
          ? "linear-gradient(90deg, rgba(22,163,74,0.16), rgba(22,163,74,0.04))"
          : "var(--surface)",
        border: `1px solid ${done ? "rgba(22,163,74,0.35)" : "var(--border)"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        (e.currentTarget as HTMLDivElement).style.borderColor = meta.color;
        (e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        (e.currentTarget as HTMLDivElement).style.borderColor = done
          ? "rgba(22,163,74,0.35)"
          : "var(--border)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
      }}
    >
      {/* Left vertical accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: "12px 0 0 12px",
          background: done ? "#16A34A" : meta.color,
        }}
      />

      {/* Category icon chip */}
      <div
        className="w-8 h-8 sm:w-9 sm:h-9"
        style={{
          borderRadius: 10,
          flexShrink: 0,
          background: done ? "rgba(22,163,74,0.16)" : meta.accent,
          color: done ? "#16A34A" : meta.color,
          border: `1px solid ${done ? "rgba(22,163,74,0.35)" : `${meta.color}55`}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {done ? <CheckCircle2 size={18} /> : <span>{meta.icon}</span>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-2)",
            lineHeight: 1.35,
            textDecoration: done ? "line-through" : "none",
            opacity: done ? 0.7 : 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {a.title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 4,
            fontSize: 10,
            color: "var(--text-dim)",
            flexWrap: "wrap",
          }}
        >
          <span
            className="hidden sm:inline"
            style={{
              color: meta.color,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {meta.label}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: urgent && !done ? "#F0A500" : "var(--text-dim)" }}>
            <Clock size={10} /> {deadlineLabel(a.deadline)}
          </span>
          {(a.streak ?? 0) > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#F0A500" }}>
              <Flame size={10} /> {a.streak}
            </span>
          )}
          {a.recurring && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#A855F7" }}>
              <Sparkles size={10} /> {a.recurring === "daily" ? "elke dag" : a.recurring === "weekly" ? "elke week" : "elke wedstrijd"}
            </span>
          )}
        </div>
      </div>

      {/* XP pill */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: done ? "#16A34A" : "#F0A500",
          background: done ? "rgba(22,163,74,0.14)" : "rgba(240,165,0,0.14)",
          border: `1px solid ${done ? "rgba(22,163,74,0.35)" : "rgba(240,165,0,0.35)"}`,
          padding: "3px 8px",
          borderRadius: 999,
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        +{a.xp ?? 0} XP
      </div>

      {/* Quick action */}
      {!done && onQuickComplete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickComplete();
          }}
          title="Markeer als behaald"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(22,163,74,0.1)",
            border: "1px solid rgba(22,163,74,0.35)",
            color: "#16A34A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#16A34A";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(22,163,74,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#16A34A";
          }}
        >
          <CheckCircle2 size={15} />
        </button>
      )}
    </div>
  );
}

function GroupHeader({
  icon, label, count, color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
        marginBottom: 6,
        padding: "4px 4px",
      }}
    >
      <span style={{ color, display: "flex" }}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: "var(--text-2)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          background: `${color}1f`,
          padding: "2px 8px",
          borderRadius: 999,
          letterSpacing: "0.04em",
        }}
      >
        {count}
      </span>
    </div>
  );
}

export function QuestDashboard({
  agreements, canEdit, filter, onFilterChange, onAdd, onSelect, onQuickComplete,
}: Props) {
  // Apply category filter (but always compute hero from all agreements).
  const visible = useMemo(() => {
    if (filter === "all") return agreements;
    return agreements.filter((a) => a.category === filter);
  }, [agreements, filter]);

  // ── Hero/progression stats ─────────────────────────────────────────
  const xpEarned = useMemo(
    () => agreements.filter((a) => a.status === "completed").reduce((sum, a) => sum + (a.xp ?? 0), 0),
    [agreements],
  );
  const level = Math.floor(xpEarned / LEVEL_XP) + 1;
  const xpIntoLevel = xpEarned % LEVEL_XP;
  const xpPct = Math.round((xpIntoLevel / LEVEL_XP) * 100);
  const tier = tierFor(level);

  const completedCount = agreements.filter((a) => a.status === "completed").length;
  const maxStreak = agreements.reduce((m, a) => Math.max(m, a.streak ?? 0), 0);

  // ── Group visible agreements by deadline bucket ────────────────────
  const groups = useMemo(() => {
    const buckets: Record<
      "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDeadline" | "completed",
      PlanAgreement[]
    > = {
      overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], noDeadline: [], completed: [],
    };
    visible.forEach((a) => {
      if (a.status === "completed") buckets.completed.push(a);
      else buckets[deadlineBucket(a.deadline)].push(a);
    });
    // Sort each bucket by deadline soonest first, then by updated_at.
    const byDeadline = (a: PlanAgreement, b: PlanAgreement) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (da !== db) return da - db;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    };
    (Object.keys(buckets) as (keyof typeof buckets)[]).forEach((k) => buckets[k].sort(byDeadline));
    return buckets;
  }, [visible]);

  const groupOrder: { key: keyof typeof groups; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "overdue",    label: "Te laat",       icon: <Clock size={13} />,        color: "#D64045" },
    { key: "today",      label: "Vandaag",       icon: <Sparkles size={13} />,     color: "#F0A500" },
    { key: "tomorrow",   label: "Morgen",        icon: <Calendar size={13} />,     color: "#4DAEE5" },
    { key: "thisWeek",   label: "Deze week",     icon: <Calendar size={13} />,     color: "#4DAEE5" },
    { key: "later",      label: "Later",         icon: <Calendar size={13} />,     color: "#94a3b8" },
    { key: "noDeadline", label: "Vrije missies", icon: <Sparkles size={13} />,     color: "#A855F7" },
    { key: "completed",  label: "Behaald",       icon: <Trophy size={13} />,       color: "#16A34A" },
  ];

  const hasAnyVisible = visible.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ───────── HERO ───────── */}
      <div
        className="p-3 sm:p-5"
        style={{
          position: "relative",
          borderRadius: 16,
          background: `linear-gradient(135deg, ${tier.color}1c 0%, var(--surface) 60%)`,
          border: `1px solid ${tier.color}55`,
          overflow: "hidden",
        }}
      >
        {/* Decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tier.color}33 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {/* Level badge */}
          <div
            className="w-12 h-12 sm:w-[60px] sm:h-[60px]"
            style={{
              borderRadius: 12,
              background: tier.color,
              color: "#0D1B2A",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${tier.color}26`,
              fontFamily: "Outfit, sans-serif",
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", opacity: 0.7 }}>LV</div>
            <div className="text-xl sm:text-2xl" style={{ fontWeight: 900, lineHeight: 0.9 }}>{level}</div>
          </div>

          <div style={{ flex: "1 1 180px", minWidth: 160 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: tier.color,
                textTransform: "uppercase",
              }}
            >
              {tier.title}
            </div>
            <div className="text-sm sm:text-base" style={{ fontWeight: 900, color: "var(--text-2)", marginTop: 2, fontFamily: "Outfit, sans-serif" }}>
              {xpEarned} XP <span style={{ color: "var(--text-dim)", fontWeight: 500 }}>totaal</span>
            </div>

            {/* XP bar */}
            <div
              style={{
                marginTop: 8,
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${xpPct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{xpIntoLevel}/{LEVEL_XP} XP</span>
              <span>nog {LEVEL_XP - xpIntoLevel} tot Level {level + 1}</span>
            </div>
          </div>

          {/* Stats column (desktop only) */}
          <div
            className="hidden sm:flex"
            style={{ flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0, minWidth: 110 }}
          >
            <HeroStat icon={<Flame size={11} />} value={maxStreak} label="best streak" color="#F0A500" />
            <HeroStat icon={<CheckCircle2 size={11} />} value={completedCount} label="behaald" color="#16A34A" />
            <HeroStat icon={<Trophy size={11} />} value={agreements.length} label="missies" color="#4DAEE5" />
          </div>
        </div>

        {/* Stats row (mobile only) — compact horizontal chips below the XP bar */}
        <div
          className="flex sm:hidden"
          style={{ gap: 6, marginTop: 10, position: "relative", zIndex: 1, flexWrap: "wrap" }}
        >
          <HeroStat icon={<Flame size={11} />} value={maxStreak} label="streak" color="#F0A500" />
          <HeroStat icon={<CheckCircle2 size={11} />} value={completedCount} label="behaald" color="#16A34A" />
          <HeroStat icon={<Trophy size={11} />} value={agreements.length} label="missies" color="#4DAEE5" />
        </div>
      </div>

      {/* ───────── FILTERS + ADD ───────── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Pills row: horizontaal scrollbaar op mobile zodat alles binnen één regel past */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            flex: 1,
            minWidth: 0,
            paddingBottom: 2,
            scrollbarWidth: "none",
          }}
        >
          <FilterPill
            active={filter === "all"}
            color="#4DAEE5"
            label="Alles"
            count={agreements.length}
            onClick={() => onFilterChange("all")}
          />
          {(Object.keys(CATEGORY_META) as PlanCategory[]).map((c) => {
            const meta = CATEGORY_META[c];
            const count = agreements.filter((a) => a.category === c).length;
            return (
              <FilterPill
                key={c}
                active={filter === c}
                color={meta.color}
                label={meta.label}
                icon={meta.icon}
                count={count}
                onClick={() => onFilterChange(c)}
              />
            );
          })}
        </div>

        {canEdit && onAdd && (
          <button
            type="button"
            onClick={() => onAdd(filter === "all" ? undefined : filter)}
            className="px-3 py-2 sm:px-4"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              background: "#16A34A",
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 0 4px rgba(22,163,74,0.18)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={13} /> <span className="hidden sm:inline">Nieuwe missie</span><span className="sm:hidden">Nieuw</span>
          </button>
        )}
      </div>

      {/* ───────── MISSION GROUPS ───────── */}
      {!hasAnyVisible ? (
        <EmptyState canEdit={canEdit} onAdd={() => onAdd?.(filter === "all" ? undefined : filter)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {groupOrder.map((group) => {
            const items = groups[group.key];
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <GroupHeader
                  icon={group.icon}
                  label={group.label}
                  count={items.length}
                  color={group.color}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((a) => (
                    <MissionCard
                      key={a.id}
                      a={a}
                      canEdit={canEdit}
                      onClick={() => onSelect?.(a)}
                      onQuickComplete={
                        a.status === "completed" || !onQuickComplete
                          ? undefined
                          : () => onQuickComplete?.(a.id)
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeroStat({
  icon, value, label, color,
}: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: `${color}14`,
        border: `1px solid ${color}33`,
        borderRadius: 999,
        fontSize: 11,
      }}
    >
      <span style={{ color, display: "flex" }}>{icon}</span>
      <span style={{ fontWeight: 800, color, fontFamily: "Outfit, sans-serif" }}>{value}</span>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
    </div>
  );
}

function FilterPill({
  active, color, label, icon, count, onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  icon?: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        background: active ? `${color}22` : "var(--surface)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        color: active ? color : "var(--text-2)",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.02em",
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: active ? color : "var(--text-dim)",
          background: active ? `${color}1f` : "transparent",
          borderRadius: 999,
          padding: "1px 6px",
          minWidth: 18,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ canEdit, onAdd }: { canEdit?: boolean; onAdd?: () => void }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 24px",
        background: "var(--surface)",
        border: "1px dashed var(--border)",
        borderRadius: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(77,174,229,0.1)",
          color: "#4DAEE5",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        {canEdit ? <Plus size={24} /> : <Lock size={22} />}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-2)" }}>
        {canEdit ? "Nog geen missies" : "Je coach moet nog missies toevoegen"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
        {canEdit
          ? "Klik op 'Nieuwe missie' om de eerste afspraak toe te voegen."
          : "Zodra je coach afspraken toevoegt verschijnen ze hier."}
      </div>
      {canEdit && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          style={{
            marginTop: 14,
            padding: "8px 14px",
            borderRadius: 999,
            background: "#16A34A",
            border: "none",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={13} /> Eerste missie toevoegen
        </button>
      )}
    </div>
  );
}
