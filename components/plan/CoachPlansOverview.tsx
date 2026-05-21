"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  listAllAgreementsForCoach,
  subscribeAllAgreements,
  CATEGORY_META,
  addAgreement,
  updateAgreement,
  setStatus,
  removeAgreement,
  type AgreementWithPlayer,
  type AgreementInput,
  type PlanAgreement,
  type PlanCategory,
  type PlanStatus,
  type PlayerLite,
} from "@/lib/personal-plan";
import { addNotification } from "@/lib/notifications";
import type { ChatMessage } from "@/lib/plan-chat";
import { AgreementModal } from "./AgreementModal";
import {
  AlarmClock, CheckCircle2, Calendar, Sparkles, Trophy, Clock, Flame,
  Search, Filter, Users, Loader2, ExternalLink,
} from "lucide-react";

type StatusFilter = "all" | PlanStatus;
type CategoryFilter = "all" | PlanCategory;

interface BucketDef {
  key: "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDeadline" | "completed";
  label: string;
  color: string;
  icon: React.ReactNode;
}

const BUCKETS: BucketDef[] = [
  { key: "overdue",    label: "Te laat",       color: "#D64045", icon: <AlarmClock size={13} /> },
  { key: "today",      label: "Vandaag",       color: "#F0A500", icon: <Sparkles size={13} /> },
  { key: "tomorrow",   label: "Morgen",        color: "#4DAEE5", icon: <Calendar size={13} /> },
  { key: "thisWeek",   label: "Deze week",     color: "#4DAEE5", icon: <Calendar size={13} /> },
  { key: "later",      label: "Later",         color: "#94a3b8", icon: <Calendar size={13} /> },
  { key: "noDeadline", label: "Vrije missies", color: "#A855F7", icon: <Sparkles size={13} /> },
  { key: "completed",  label: "Behaald",       color: "#16A34A", icon: <Trophy size={13} /> },
];

function bucketFor(a: PlanAgreement): BucketDef["key"] {
  if (a.status === "completed") return "completed";
  if (!a.deadline) return "noDeadline";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((new Date(a.deadline).getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "thisWeek";
  return "later";
}

function deadlineHint(deadline?: string | null) {
  if (!deadline) return "geen deadline";
  const now = new Date();
  const d = new Date(deadline);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((d.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d te laat`;
  if (days === 0) return "vandaag";
  if (days === 1) return "morgen";
  if (days <= 7) return `over ${days} dagen`;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function PlayerChip({ player }: { player: PlayerLite }) {
  const initials = `${player.first_name?.[0] ?? ""}${player.last_name?.[0] ?? ""}`.toUpperCase();
  return (
    <Link
      href={`/dashboard/coach/players/${player.id}/plan`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px 3px 3px",
        borderRadius: 999,
        background: "rgba(77,174,229,0.1)",
        border: "1px solid rgba(77,174,229,0.25)",
        color: "#4DAEE5",
        fontSize: 11,
        fontWeight: 700,
        textDecoration: "none",
        flexShrink: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4DAEE5, #1B6CA8)",
          color: "#001B48",
          fontSize: 9,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {player.first_name} {player.last_name}
      </span>
    </Link>
  );
}

interface AgreementRowProps {
  item: AgreementWithPlayer;
  onClick: () => void;
}

function AgreementRow({ item, onClick }: AgreementRowProps) {
  const meta = CATEGORY_META[item.category];
  const done = item.status === "completed";
  const b = bucketFor(item);
  const urgent = b === "overdue" || b === "today";

  return (
    <div
      onClick={onClick}
      role="button"
      className="px-2.5 py-2 sm:px-3 sm:py-2.5"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 10,
        background: done
          ? "linear-gradient(90deg, rgba(22,163,74,0.10), rgba(22,163,74,0.02))"
          : "var(--surface)",
        border: `1px solid ${done ? "rgba(22,163,74,0.30)" : "var(--border)"}`,
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = meta.color;
        (e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = done
          ? "rgba(22,163,74,0.30)" : "var(--border)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 3,
          borderRadius: "10px 0 0 10px",
          background: done ? "#16A34A" : meta.color,
        }}
      />

      <div
        className="w-7 h-7 sm:w-8 sm:h-8"
        style={{
          borderRadius: 8,
          flexShrink: 0,
          background: done ? "rgba(22,163,74,0.16)" : meta.accent,
          color: done ? "#16A34A" : meta.color,
          border: `1px solid ${done ? "rgba(22,163,74,0.35)" : `${meta.color}55`}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        {done ? <CheckCircle2 size={14} /> : <span>{meta.icon}</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-2)",
            lineHeight: 1.3,
            textDecoration: done ? "line-through" : "none",
            opacity: done ? 0.65 : 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 3,
            fontSize: 10,
            color: "var(--text-dim)",
            flexWrap: "wrap",
          }}
        >
          <PlayerChip player={item.player} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: urgent && !done ? "#F0A500" : "var(--text-dim)" }}>
            <Clock size={10} /> {deadlineHint(item.deadline)}
          </span>
          {(item.streak ?? 0) > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#F0A500" }}>
              <Flame size={10} /> {item.streak}
            </span>
          )}
        </div>
      </div>

      <div
        className="hidden sm:flex"
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: done ? "#16A34A" : "#F0A500",
          background: done ? "rgba(22,163,74,0.14)" : "rgba(240,165,0,0.14)",
          border: `1px solid ${done ? "rgba(22,163,74,0.35)" : "rgba(240,165,0,0.35)"}`,
          padding: "3px 8px",
          borderRadius: 999,
          flexShrink: 0,
        }}
      >
        +{item.xp ?? 0}
      </div>

      <ExternalLink size={13} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
    </div>
  );
}

interface Props {
  coachName: string;
  viewerId: string | null;
}

export function CoachPlansOverview({ coachName, viewerId }: Props) {
  const [items, setItems] = useState<AgreementWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");

  // Modal state
  const [activeAgreement, setActiveAgreement] = useState<AgreementWithPlayer | null>(null);
  const [modalMode, setModalMode] = useState<"edit" | "view" | null>(null);

  const refresh = useCallback(async () => {
    const next = await listAllAgreementsForCoach();
    setItems(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeAllAgreements(() => { void refresh(); });
  }, [refresh]);

  // Unique player list for the player filter
  const players = useMemo(() => {
    const map = new Map<string, PlayerLite>();
    items.forEach((i) => map.set(i.player.id, i.player));
    return Array.from(map.values()).sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    );
  }, [items]);

  // Apply filters
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      if (playerFilter !== "all" && i.player.id !== playerFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = `${i.title} ${i.description ?? ""} ${i.player.first_name} ${i.player.last_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, playerFilter, query]);

  // Group by bucket
  const buckets = useMemo(() => {
    const map: Record<BucketDef["key"], AgreementWithPlayer[]> = {
      overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], noDeadline: [], completed: [],
    };
    filtered.forEach((i) => map[bucketFor(i)].push(i));
    const sortByDeadline = (a: PlanAgreement, b: PlanAgreement) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (da !== db) return da - db;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    };
    (Object.keys(map) as BucketDef["key"][]).forEach((k) => map[k].sort(sortByDeadline));
    return map;
  }, [filtered]);

  // Top-level reminder stats (from unfiltered items so they reflect global reality)
  const stats = useMemo(() => {
    const all = items;
    const overdue   = all.filter((i) => i.status !== "completed" && bucketFor(i) === "overdue").length;
    const dueToday  = all.filter((i) => i.status !== "completed" && bucketFor(i) === "today").length;
    const dueWeek   = all.filter((i) => i.status !== "completed" && ["today","tomorrow","thisWeek"].includes(bucketFor(i))).length;
    const completed = all.filter((i) => i.status === "completed").length;
    return { overdue, dueToday, dueWeek, completed, total: all.length };
  }, [items]);

  // ── Mutation handlers (proxied to the modal) ───────────────────────
  function openDetail(item: AgreementWithPlayer) {
    setActiveAgreement(item);
    setModalMode("edit");
  }

  async function handleSave(input: AgreementInput) {
    if (!activeAgreement) return;
    await addAgreement(activeAgreement.player.id, { ...input, created_by_name: coachName });
    void refresh();
  }

  async function handleUpdate(id: string, patch: Partial<PlanAgreement>) {
    if (!activeAgreement) return;
    await updateAgreement(activeAgreement.player.id, id, patch);
    void refresh();
  }

  async function handleDelete(id: string) {
    if (!activeAgreement) return;
    await removeAgreement(activeAgreement.player.id, id);
    setActiveAgreement(null);
    setModalMode(null);
    void refresh();
  }

  async function handleSetStatus(id: string, status: PlanStatus) {
    if (!activeAgreement) return;
    await setStatus(activeAgreement.player.id, id, status);
    void refresh();
  }

  async function handleChatSent(msg: ChatMessage) {
    if (!activeAgreement) return;
    if (msg.author_role === "coach") {
      const snippet = msg.body.length > 80 ? msg.body.slice(0, 80) + "…" : msg.body;
      await addNotification({
        player_id: activeAgreement.player.id,
        type: "chat_message",
        title: `${coachName} reageerde op "${activeAgreement.title}"`,
        body: snippet,
        href: "/dashboard/player/plan",
        meta: { agreement_id: msg.agreement_id, message_id: msg.id },
      });
    }
  }

  function closeModal() {
    setActiveAgreement(null);
    setModalMode(null);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 8 }}>
        <Loader2 size={14} className="animate-spin" /> Plannen laden...
      </div>
    );
  }

  const bucketOrder: BucketDef[] = statusFilter === "completed"
    ? BUCKETS.filter((b) => b.key === "completed")
    : BUCKETS;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* ─── Reminder cards ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 8,
        }}
      >
        <ReminderCard
          color="#D64045"
          icon={<AlarmClock size={14} />}
          label="Te laat"
          value={stats.overdue}
          hint="vereisen actie"
        />
        <ReminderCard
          color="#F0A500"
          icon={<Sparkles size={14} />}
          label="Vandaag"
          value={stats.dueToday}
          hint="deadline vandaag"
        />
        <ReminderCard
          color="#4DAEE5"
          icon={<Calendar size={14} />}
          label="Deze week"
          value={stats.dueWeek}
          hint="komende 7 dagen"
        />
        <ReminderCard
          color="#16A34A"
          icon={<Trophy size={14} />}
          label="Behaald"
          value={stats.completed}
          hint={`van ${stats.total} totaal`}
        />
      </div>

      {/* ─── Filters ─── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            flex: "1 1 200px",
            minWidth: 160,
          }}
        >
          <Search size={13} style={{ color: "var(--text-dim)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek titel of speler..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-2)",
              fontSize: 12,
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
        </label>

        <SelectFilter
          icon={<Filter size={12} />}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: "all", label: "Alle statussen" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "Bezig" },
            { value: "completed", label: "Behaald" },
            { value: "missed", label: "Gemist" },
          ]}
        />

        <SelectFilter
          icon={<Filter size={12} />}
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as CategoryFilter)}
          options={[
            { value: "all", label: "Alle categorieën" },
            { value: "mental", label: "🧠 Mentaal" },
            { value: "technical", label: "⚽ Voetbalinhoudelijk" },
            { value: "tactical", label: "🎯 Tactisch" },
          ]}
        />

        <SelectFilter
          icon={<Users size={12} />}
          value={playerFilter}
          onChange={(v) => setPlayerFilter(v)}
          options={[
            { value: "all", label: "Alle spelers" },
            ...players.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` })),
          ]}
        />
      </div>

      {/* ─── Buckets ─── */}
      {filtered.length === 0 ? (
        <EmptyState totalItems={items.length} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bucketOrder.map((b) => {
            const list = buckets[b.key];
            if (list.length === 0) return null;
            return (
              <div key={b.key}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                    marginBottom: 6,
                    padding: "0 4px",
                  }}
                >
                  <span style={{ color: b.color, display: "flex" }}>{b.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "var(--text-2)",
                      textTransform: "uppercase",
                    }}
                  >
                    {b.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: b.color,
                      background: `${b.color}1f`,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {list.length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {list.map((item) => (
                    <AgreementRow
                      key={item.id}
                      item={item}
                      onClick={() => openDetail(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalMode && activeAgreement && (
        <AgreementModal
          mode={modalMode}
          canEdit={true}
          agreement={activeAgreement}
          playerId={activeAgreement.player.id}
          viewerId={viewerId}
          viewerRole="coach"
          viewerName={coachName}
          onClose={closeModal}
          onSave={handleSave}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onSetStatus={handleSetStatus}
          onChatMessageSent={handleChatSent}
        />
      )}
    </div>
  );
}

function ReminderCard({
  color, icon, label, value, hint,
}: { color: string; icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: `linear-gradient(135deg, ${color}1a 0%, var(--surface) 80%)`,
        border: `1px solid ${color}55`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {icon} {label}
      </div>
      <div className="text-xl sm:text-2xl" style={{ fontWeight: 900, color: "var(--text-2)", fontFamily: "Outfit, sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{hint}</div>
    </div>
  );
}

function SelectFilter({
  icon, value, onChange, options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--text-dim)", display: "flex" }}>{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-2)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          maxWidth: 160,
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--bg)" }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ totalItems }: { totalItems: number }) {
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
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "rgba(77,174,229,0.1)",
          color: "#4DAEE5",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Trophy size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-2)" }}>
        {totalItems === 0 ? "Nog geen afspraken" : "Geen afspraken voor deze filters"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
        {totalItems === 0
          ? "Open een speler en plaats de eerste missie op zijn bord."
          : "Pas de filters aan om meer te zien."}
      </div>
    </div>
  );
}

// Re-export so the helper for resolving the current coach's profile can be shared.
export async function resolveCoachContext(): Promise<{ id: string | null; name: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, name: "Coach" };
    const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    return { id: user.id, name: data?.full_name ?? "Coach" };
  } catch {
    return { id: null, name: "Coach" };
  }
}
