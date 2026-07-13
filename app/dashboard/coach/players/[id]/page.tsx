"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPlayerById } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, BADGE_CONFIG, POSITION_LABELS, CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { getRatingColor, formatDate, getAge, getScoreColor } from "@/lib/utils";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerRadarChart } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLine";
import type { Evaluation, PlayerWithDetails } from "@/lib/types";
import Image from "next/image";
import {
  ArrowLeft, Brain, Zap, Star, Trophy, TrendingUp, TrendingDown,
  Minus, Plus, Calendar, Target, Loader2, Sparkles, UserCircle, ChevronDown, ChevronUp, Flag, Trash2, X, AlertTriangle,
} from "lucide-react";
import { EVALUATION_SCHEMA } from "@/lib/types";
import { PlayerPhotoUpload } from "@/components/ui/PlayerPhotoUpload";
import { sendCoachUpdate } from "@/lib/coach-notify";
import { MBTI_PROFILES, situationalCues, type MbtiCode } from "@/lib/mbti";
import { Mail, Send } from "lucide-react";

function parseSubScores(subNotes?: string): Record<string, number> | null {
  if (!subNotes) return null;
  try { return JSON.parse(subNotes); } catch { return null; }
}

function lastSeenLabel(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 120) return "zojuist";
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  if (diff < 172800) return "gisteren";
  const days = Math.floor(diff / 86400);
  if (days < 14) return `${days} dagen geleden`;
  return new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "2-digit" });
}

function SubCriteriaBreakdown({ categoryId, subNotes }: { categoryId: string; subNotes?: string }) {
  const schema = EVALUATION_SCHEMA.find((c) => c.id === categoryId);
  const subScores = parseSubScores(subNotes);
  if (!schema || !subScores) return null;
  return (
    <div className="mt-2 pt-2 border-t border-hub-border space-y-1.5">
      {schema.subcategories.map((sub) => {
        const val = subScores[sub.id];
        if (val === undefined) return null;
        const sc = val >= 8.5 ? "#f59e0b" : val >= 7 ? "#4FA9E6" : val >= 5 ? "#4FA9E6" : "#ef4444";
        return (
          <div key={sub.id} className="flex items-center gap-2">
            <div className="w-32 text-[10px] text-slate-500 truncate flex-shrink-0">{sub.label}</div>
            <div className="flex-1 h-1.5 bg-hub-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: sc }} />
            </div>
            <div className="text-[11px] font-bold w-5 text-right tabular-nums flex-shrink-0" style={{ color: sc }}>{val}</div>
          </div>
        );
      })}
    </div>
  );
}

function buildProgressData(evaluations: Evaluation[]) {
  return [...evaluations]
    .sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime())
    .map((ev) => {
      const scoreMap: Record<string, number> = {};
      ev.scores?.forEach((s) => { scoreMap[s.category] = s.score; });
      return { date: ev.evaluation_date, overall: ev.overall_score ?? 7, ...scoreMap };
    });
}

function getConsensusAssessment(evals: Evaluation[]) {
  const archetypeCounts: Record<string, number> = {};
  const sociotypeCounts: Record<string, number> = {};
  const positionCounts: Record<string, number> = {};

  evals.forEach((ev) => {
    if (ev.assessed_archetype) archetypeCounts[ev.assessed_archetype] = (archetypeCounts[ev.assessed_archetype] || 0) + 1;
    if (ev.assessed_sociotype) sociotypeCounts[ev.assessed_sociotype] = (sociotypeCounts[ev.assessed_sociotype] || 0) + 1;
    if (ev.assessed_position) positionCounts[ev.assessed_position] = (positionCounts[ev.assessed_position] || 0) + 1;
  });

  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSociotype = Object.entries(sociotypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPosition = Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    archetype: topArchetype,
    sociotype: topSociotype,
    position: topPosition,
    totalAssessments: evals.filter((e) => e.assessed_archetype || e.assessed_sociotype).length,
  };
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "dna" | "evaluations" | "challenges">("overview");
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [annSubject, setAnnSubject] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [annResult, setAnnResult] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const router = useRouter();

  async function handleSendAnnouncement() {
    if (!player || !annSubject.trim() || !annMessage.trim()) return;
    setSending(true); setAnnResult(null);
    const r = await sendCoachUpdate({ playerId: player.id, subject: annSubject.trim(), message: annMessage.trim(), type: "reminder" });
    setSending(false);
    if (!r.ok) { setAnnResult(`Mislukt: ${r.error}`); return; }
    setAnnResult(r.emailed ? "Verstuurd — melding + e-mail" : `Melding geplaatst (e-mail niet verzonden: ${r.emailError ?? "onbekend"})`);
    setAnnSubject(""); setAnnMessage("");
    setTimeout(() => { setShowAnnounce(false); setAnnResult(null); }, 2200);
  }

  function toggleScore(key: string) {
    setExpandedScores((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  async function handleDeletePlayer() {
    if (!player) return;
    setDeleting(true); setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase.from("players").delete().eq("id", player.id);
    if (error) { setDeleteError(error.message); setDeleting(false); return; }
    router.push("/dashboard/coach/players");
    router.refresh();
  }

  useEffect(() => {
    async function load() {
      if (!id) return;
      const p = await getPlayerById(id);
      setPlayer(p);
      setLoading(false);
      if (p?.profile_id) {
        try {
          const { data: prof } = await createClient().from("profiles").select("last_seen_at").eq("id", p.profile_id).single();
          setLastSeen(prof?.last_seen_at ?? null);
        } catch { /* ignore */ }
      }
    }
    load();
  }, [id]);

  async function updateChallengeProgress(challengeId: string, progress: number) {
    setUpdatingProgress(challengeId);
    const supabase = createClient();
    const status = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "open";
    await supabase.from("challenges").update({ progress, status }).eq("id", challengeId);
    // Refresh player data
    if (id) {
      const updated = await getPlayerById(id);
      setPlayer(updated);
    }
    setUpdatingProgress(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-hub-teal" />
    </div>
  );

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <p className="text-lg font-bold text-slate-900 mb-2">Speler niet gevonden</p>
        <Link href="/dashboard/coach/players" className="text-hub-teal hover:underline mt-2 text-sm">
          ← Terug naar spelers
        </Link>
      </div>
    );
  }

  const identity = player.identity;
  const primaryArch = identity?.primary_archetype ? ARCHETYPES[identity.primary_archetype] : null;
  const secondaryArch = identity?.secondary_archetype ? ARCHETYPES[identity.secondary_archetype] : null;
  const primarySocio = identity?.primary_sociotype ? SOCIOTYPES[identity.primary_sociotype] : null;
  const secondarySocio = identity?.secondary_sociotype ? SOCIOTYPES[identity.secondary_sociotype] : null;
  const badge = player.badge ? BADGE_CONFIG[player.badge] : null;
  const rColor = getRatingColor(player.overall_rating);
  const progressData = buildProgressData(player.evaluations ?? []);

  const latestEval = player.evaluations?.[0];
  const radarData = latestEval?.scores?.map((s) => ({
    subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS],
    value: s.score,
    fullMark: 10,
  })) ?? [];

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <Star size={14} /> },
    { id: "dna" as const, label: "Player DNA", icon: <Brain size={14} /> },
    { id: "evaluations" as const, label: "Evaluaties", icon: <Zap size={14} /> },
    { id: "challenges" as const, label: "Challenges", icon: <Trophy size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Delete confirm modal */}
      {showDelete && (
        <div onClick={() => !deleting && setShowDelete(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(13,27,42,0.55)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "min(420px,100%)", background: "#fff", borderRadius: 18, border: "1px solid rgba(13,27,42,0.08)",
              boxShadow: "0 24px 64px rgba(13,27,42,0.25)", padding: 26, fontFamily: "'Archivo',system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(214,64,69,0.1)", border: "1px solid rgba(214,64,69,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#D64045" }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0D1B2A" }}>Speler verwijderen?</h3>
              </div>
              <button onClick={() => !deleting && setShowDelete(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9BAABB" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13.5, color: "#5A6B80", lineHeight: 1.55, marginBottom: 6 }}>
              Je staat op het punt <b style={{ color: "#0D1B2A" }}>{player.first_name} {player.last_name}</b> definitief te verwijderen.
            </p>
            <p style={{ fontSize: 12.5, color: "#9BAABB", lineHeight: 1.5, marginBottom: 20 }}>
              Alle evaluaties, plannen, challenges en check-ins van deze speler worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.
            </p>
            {deleteError && <p style={{ fontSize: 12, color: "#D64045", marginBottom: 12 }}>⚠ {deleteError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                style={{ flex: 1, height: 44, borderRadius: 11, border: "1px solid rgba(13,27,42,0.12)", background: "#fff",
                  color: "#5A6B80", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Annuleren
              </button>
              <button onClick={handleDeletePlayer} disabled={deleting}
                style={{ flex: 1, height: 44, borderRadius: 11, border: "none", background: "#D64045", color: "#fff",
                  fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement modal */}
      {showAnnounce && (
        <div onClick={() => !sending && setShowAnnounce(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(13,27,42,0.55)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "min(460px,100%)", background: "#fff", borderRadius: 18, border: "1px solid rgba(13,27,42,0.08)",
              boxShadow: "0 24px 64px rgba(13,27,42,0.25)", padding: 24, fontFamily: "'Archivo',system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(27,108,168,0.1)", border: "1px solid rgba(27,108,168,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#1B6CA8" }}><Mail size={17} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0D1B2A" }}>Mededeling aan {player.first_name}</h3>
              </div>
              <button onClick={() => !sending && setShowAnnounce(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9BAABB" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12, color: "#9BAABB", marginBottom: 16 }}>Speler krijgt een melding op het dashboard én een e-mail op zijn eigen adres.</p>
            <input value={annSubject} onChange={(e) => setAnnSubject(e.target.value)} placeholder="Onderwerp" disabled={sending}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, fontSize: 14, marginBottom: 10,
                border: "1px solid rgba(13,27,42,0.12)", color: "#0D1B2A", outline: "none" }} />
            <textarea value={annMessage} onChange={(e) => setAnnMessage(e.target.value)} placeholder="Je bericht…" rows={4} disabled={sending}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, fontSize: 14, resize: "vertical",
                border: "1px solid rgba(13,27,42,0.12)", color: "#0D1B2A", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
            {annResult && <p style={{ fontSize: 12, color: annResult.startsWith("Mislukt") ? "#D64045" : "#2E9E6B", marginTop: 10 }}>{annResult}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowAnnounce(false)} disabled={sending}
                style={{ flex: 1, height: 44, borderRadius: 11, border: "1px solid rgba(13,27,42,0.12)", background: "#fff", color: "#5A6B80", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Annuleren</button>
              <button onClick={handleSendAnnouncement} disabled={sending || !annSubject.trim() || !annMessage.trim()}
                style={{ flex: 1, height: 44, borderRadius: 11, border: "none", background: "#1B6CA8", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: (sending || !annSubject.trim() || !annMessage.trim()) ? 0.6 : 1 }}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Versturen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <Link href="/dashboard/coach/players" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> Terug naar spelers
      </Link>

      {/* Premium page header */}
      <div className="hub-page-header p-6 sm:p-8">
        <div className="flex items-center gap-6">
          {/* Avatar — Coach can upload player photo here */}
          <div className="relative flex-shrink-0" style={{ paddingBottom: 14 }}>
            <PlayerPhotoUpload
              playerId={player.id}
              initialPhotoUrl={player.photo_url ?? player.avatar_url ?? null}
              name={`${player.first_name} ${player.last_name}`}
              position={player.position}
              size="xl"
              onUploaded={(url) => {
                setPlayer((prev) => prev ? { ...prev, photo_url: url } : prev);
              }}
            />
            {player.jersey_number && (
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-md border border-white"
                style={{ background: `${rColor}15`, color: rColor, zIndex: 10 }}>
                #{player.jersey_number}
              </div>
            )}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-hub-teal mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
              {player.first_name} <span style={{ color: rColor }}>{player.last_name.toUpperCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${rColor}10`, color: rColor }}>
                {POSITION_LABELS[player.position]}
              </span>
              {badge && (
                <span className="hub-tag text-[10px] font-black" style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              )}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                style={{ background: lastSeen ? "rgba(46,158,107,0.1)" : "rgba(148,163,184,0.12)", color: lastSeen ? "#2E9E6B" : "#94A3B8" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: lastSeen ? "#2E9E6B" : "#94A3B8" }} />
                {lastSeen ? `Laatst actief ${lastSeenLabel(lastSeen)}` : "Nog niet ingelogd"}
              </span>
              {player.mbti_type && MBTI_PROFILES[player.mbti_type as MbtiCode] && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                  style={{ background: `${MBTI_PROFILES[player.mbti_type as MbtiCode].color}18`, color: MBTI_PROFILES[player.mbti_type as MbtiCode].color }}>
                  {MBTI_PROFILES[player.mbti_type as MbtiCode].icon} {player.mbti_type} · {MBTI_PROFILES[player.mbti_type as MbtiCode].nickname}
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                player.trend === "up" ? "bg-sky-50 text-sky-600" :
                player.trend === "down" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
              }`}>
                {player.trend === "up" ? <TrendingUp size={10} /> : player.trend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
                {player.trend === "up" ? "Stijgend" : player.trend === "down" ? "Dalend" : "Stabiel"}
              </span>
              {player.team_name && <span className="text-xs text-slate-500">{player.team_name}</span>}
              {player.date_of_birth && <span className="text-xs text-slate-500">{getAge(player.date_of_birth)} jaar</span>}
            </div>
            {player.recent_scores && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(player.recent_scores).map(([cat, score]) => {
                  const sc = score >= 8 ? "#2B8AC7" : score >= 6 ? "#4FA9E6" : "#ef4444";
                  const bg = score >= 8 ? "#d1fae5" : score >= 6 ? "#E8F4FC" : "#fee2e2";
                  return (
                    <span key={cat} className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: bg, color: sc }}>
                      {cat.slice(0,3).toUpperCase()} {score.toFixed(1)}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3 mt-4">
              <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: `${rColor}10`, color: rColor, border: `1px solid ${rColor}25` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${rColor}20`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = `${rColor}10`; }}>
                <Plus size={13} /> Evaluatie aanmaken
              </Link>
              <Link href={`/dashboard/coach/players/${player.id}/plan`}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(22,163,74,0.14)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(22,163,74,0.08)"; }}>
                <Flag size={13} /> Persoonlijk plan
              </Link>
              <button onClick={() => setShowAnnounce(true)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: "rgba(27,108,168,0.08)", color: "#1B6CA8", border: "1px solid rgba(27,108,168,0.25)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(27,108,168,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(27,108,168,0.08)"; }}>
                <Mail size={13} /> Mededeling sturen
              </button>
              <button onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                style={{ background: "rgba(214,64,69,0.08)", color: "#D64045", border: "1px solid rgba(214,64,69,0.25)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(214,64,69,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(214,64,69,0.08)"; }}>
                <Trash2 size={13} /> Verwijder speler
              </button>
            </div>
          </div>

          {/* Big rating — desktop */}
          <div className="hidden sm:flex flex-col items-end gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="font-black tabular-nums leading-none" style={{ color: rColor, fontSize: "4.5rem", fontFamily: "Outfit, sans-serif" }}>{player.overall_rating}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest -mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-hub-surface border border-hub-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center ${
              activeTab === tab.id ? "bg-hub-teal text-hub-bg" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PlayerCard player={player} variant="full" />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="hub-card p-5">
              <div className="hub-label mb-4">Performance Radar</div>
              {radarData.length > 0 ? (
                <PlayerRadarChart data={radarData} color={rColor} size={250} />
              ) : (
                <div className="h-60 flex items-center justify-center text-slate-600 text-sm">
                  Evalueer de speler voor radar data
                </div>
              )}
            </div>

            <div className="hub-card p-5">
              <div className="hub-label mb-4">Rating Progressie ({(player.evaluations?.length ?? 0)} evaluaties)</div>
              {progressData.length > 1 ? (
                <ProgressLineChart data={progressData} showCategories height={180} />
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
                  Meer evaluaties nodig voor trends
                </div>
              )}
            </div>

            {player.recent_scores && (
              <div className="hub-card p-5">
                <div className="hub-label mb-4">Categorie Scores</div>
                <div className="space-y-3">
                  {Object.entries(player.recent_scores).map(([cat, score]) => {
                    const sColor = getScoreColor(score);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <span>{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}</span>
                          {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                        </div>
                        <div className="flex-1 h-2 bg-hub-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(score / 10) * 100}%`, backgroundColor: sColor }} />
                        </div>
                        <div className="text-sm font-bold w-8 tabular-nums text-right" style={{ color: sColor }}>
                          {score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DNA TAB */}
      {activeTab === "dna" && (
        <div className="space-y-6">
          {/* MBTI persoonlijkheidstype */}
          {player.mbti_type && MBTI_PROFILES[player.mbti_type as MbtiCode] && (() => {
            const mp = MBTI_PROFILES[player.mbti_type as MbtiCode];
            const cues = situationalCues(mp.code);
            return (
              <div className="hub-card p-5" style={{ borderTop: `3px solid ${mp.color}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${mp.color}16`, border: `1px solid ${mp.color}30` }}>{mp.icon}</div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black" style={{ color: mp.color, fontFamily: "Outfit, sans-serif" }}>{mp.code}</span>
                      <span className="text-sm font-bold text-slate-900">{mp.nickname}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{mp.summary}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#2E9E6B" }}>Kracht → handeling</div>
                    <ul className="space-y-2.5">
                      {mp.strengths.map((s, i) => (
                        <li key={i} className="text-xs"><span className="font-bold text-slate-800">▲ {s.label}</span><span className="block text-slate-500 mt-0.5">→ {s.tip}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#D64045" }}>Valkuil → handeling</div>
                    <ul className="space-y-2.5">
                      {mp.pitfalls.map((s, i) => (
                        <li key={i} className="text-xs"><span className="font-bold text-slate-800">▼ {s.label}</span><span className="block text-slate-500 mt-0.5">→ {s.tip}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-hub-border">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Per situatie op het veld</div>
                  <div className="space-y-1.5">
                    {cues.map((c, i) => (
                      <div key={i} className="text-xs text-slate-600"><span>{c.icon}</span> <b className="text-slate-800">{c.situation}:</b> {c.trait}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {!identity ? (
            <div className="hub-card p-12 text-center space-y-4">
              <Brain size={40} className="text-slate-700 mx-auto" />
              <div className="text-slate-900 font-bold">Player DNA nog niet ingesteld</div>
              <p className="text-slate-600 text-sm">Stel het DNA-profiel handmatig in via evaluaties.</p>
            </div>
          ) : (
            <>
              {identity.ai_summary && (
                <div className="hub-card p-5 border-hub-teal/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-hub-teal/15">
                        <Sparkles size={16} className="text-hub-teal" />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">AI Scouting Analyse</div>
                    </div>
                    {identity.last_ai_analysis && (
                      <span className="text-xs text-slate-600">{formatDate(identity.last_ai_analysis)}</span>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{identity.ai_summary}</p>
                  {identity.ai_fit_score && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-hub-border">
                      <div>
                        <div className="hub-label">Fit Score</div>
                        <div className="text-2xl font-black tabular-nums mt-1" style={{ color: getRatingColor(identity.ai_fit_score) }}>
                          {identity.ai_fit_score}<span className="text-sm text-slate-600 font-normal">/100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="hub-card p-5">
                  <div className="hub-label mb-4">Archetype Profiel</div>
                  <div className="space-y-3">
                    {primaryArch && (
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ borderColor: `${primaryArch.color}40`, background: `${primaryArch.color}08` }}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{primaryArch.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{primaryArch.label}</span>
                              <span className="hub-tag text-[10px]" style={{ background: `${primaryArch.color}20`, color: primaryArch.color }}>Primair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{primaryArch.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {primaryArch.traits.map((t) => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-hub-border text-slate-600">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {secondaryArch && (
                      <div className="p-4 rounded-xl border border-hub-border bg-hub-surface">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{secondaryArch.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 text-sm">{secondaryArch.label}</span>
                              <span className="hub-tag text-[10px] bg-hub-border text-slate-600">Secundair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{secondaryArch.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!primaryArch && !secondaryArch && (
                      <p className="text-slate-600 text-sm">Geen archetype data.</p>
                    )}
                  </div>
                </div>

                <div className="hub-card p-5">
                  <div className="hub-label mb-4">Sociotype Profiel</div>
                  <div className="space-y-3">
                    {primarySocio && (
                      <div className="p-4 rounded-xl border transition-all"
                        style={{ borderColor: `${primarySocio.color_hex}40`, background: `${primarySocio.color_hex}08` }}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{primarySocio.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{primarySocio.label}</span>
                              <span className="hub-tag text-[10px]" style={{ background: `${primarySocio.color_hex}20`, color: primarySocio.color_hex }}>Primair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{primarySocio.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {secondarySocio && (
                      <div className="p-4 rounded-xl border border-hub-border bg-hub-surface">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{secondarySocio.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 text-sm">{secondarySocio.label}</span>
                              <span className="hub-tag text-[10px] bg-hub-border text-slate-600">Secundair</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{secondarySocio.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!primarySocio && !secondarySocio && (
                      <p className="text-slate-600 text-sm">Geen sociotype data.</p>
                    )}
                  </div>
                </div>
              </div>

              {(identity.core_noodzaak !== undefined || identity.core_creativiteit !== undefined) && (
                <div className="hub-card p-5">
                  <div className="hub-label mb-5">Kernwaarden</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: "noodzaak", label: "Noodzaak", value: identity.core_noodzaak ?? 0, color: "#ef4444", desc: "Fysiek vermogen & werkethiek" },
                      { key: "creativiteit", label: "Creativiteit", value: identity.core_creativiteit ?? 0, color: "#a855f7", desc: "Techniek & tactisch inzicht" },
                      { key: "vertrouwen", label: "Vertrouwen", value: identity.core_vertrouwen ?? 0, color: "#4FA9E6", desc: "Mentale kracht & consistentie" },
                    ].map((kv) => (
                      <div key={kv.key} className="p-4 rounded-xl border border-hub-border bg-hub-surface space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{kv.label}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                              <circle cx="32" cy="32" r="28" fill="none" stroke={kv.color} strokeWidth="6"
                                strokeDasharray={`${kv.value * 1.759} 175.9`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-black tabular-nums" style={{ color: kv.color }}>{kv.value}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 leading-snug">{kv.desc}</div>
                        </div>
                        <div className="h-1.5 bg-hub-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${kv.value}%`, backgroundColor: kv.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* EVALUATIONS TAB */}
      {activeTab === "evaluations" && (() => {
        const evals = player.evaluations ?? [];
        const consensus = getConsensusAssessment(evals);
        const consensusArch = consensus.archetype ? ARCHETYPES[consensus.archetype as keyof typeof ARCHETYPES] : null;
        const consensusSocio = consensus.sociotype ? SOCIOTYPES[consensus.sociotype as keyof typeof SOCIOTYPES] : null;

        const latestEvalForRadar = evals[0];
        const evalRadarData = latestEvalForRadar?.scores?.map((s) => ({
          subject: CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] ?? s.category,
          value: s.score,
          fullMark: 10,
        })) ?? [];

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">{evals.length} evaluaties totaal</div>
              <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                className="hub-btn-primary flex items-center gap-2 text-xs">
                <Plus size={14} /> Nieuwe evaluatie
              </Link>
            </div>

            {/* Radar van laatste evaluatie */}
            {evalRadarData.length > 0 && (
              <div className="hub-card p-5"
                style={{ border: "1px solid rgba(79,169,230,0.18)", background: "linear-gradient(135deg, #f0f7fd 0%, #ffffff 100%)" }}>
                <div className="hub-label mb-1">Performance Radar — Laatste Evaluatie</div>
                <p className="text-xs text-slate-500 mb-3">
                  {latestEvalForRadar ? formatDate(latestEvalForRadar.evaluation_date) : ""}
                  {latestEvalForRadar?.overall_score !== undefined && (
                    <span className="ml-2 font-bold" style={{ color: rColor }}>
                      {latestEvalForRadar.overall_score.toFixed(1)}/10
                    </span>
                  )}
                </p>
                <div className="flex justify-center">
                  <PlayerRadarChart data={evalRadarData} color={rColor} size={280} />
                </div>
              </div>
            )}

            {consensus.totalAssessments > 0 && (
              <div className="hub-card p-5 border-hub-teal/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: "rgba(79,169,230,0.1)" }}>
                    <Brain size={14} style={{ color: "#4FA9E6" }} />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Consensus Spelertype</span>
                  <span className="text-xs text-slate-600">— op basis van {consensus.totalAssessments} beoordelingen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consensusArch && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: `${consensusArch.color}18`, color: consensusArch.color, border: `1px solid ${consensusArch.color}40` }}>
                      {consensusArch.icon} {consensusArch.label}
                    </span>
                  )}
                  {consensusSocio && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: `${consensusSocio.color_hex}18`, color: consensusSocio.color_hex, border: `1px solid ${consensusSocio.color_hex}40` }}>
                      {consensusSocio.icon} {consensusSocio.label}
                    </span>
                  )}
                  {consensus.position && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-hub-surface text-slate-600 border border-hub-border">
                      {POSITION_LABELS[consensus.position as keyof typeof POSITION_LABELS]}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {evals.map((ev) => {
                const arch = ev.assessed_archetype ? ARCHETYPES[ev.assessed_archetype] : null;
                const socio = ev.assessed_sociotype ? SOCIOTYPES[ev.assessed_sociotype] : null;
                return (
                  <div key={ev.id} className="hub-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-600" />
                          <span className="text-sm font-semibold text-slate-900">{formatDate(ev.evaluation_date)}</span>
                        </div>
                        {ev.coach_name && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <UserCircle size={12} />
                            {ev.coach_name}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-black tabular-nums" style={{ color: getRatingColor(((ev.overall_score ?? 7) - 1) / 9 * 59 + 40) }}>
                        {ev.overall_score?.toFixed(1)}/10
                      </div>
                    </div>
                    {ev.scores && ev.scores.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                        {ev.scores.map((s) => {
                          const sc = getScoreColor(s.score);
                          const key = `${ev.id}-${s.category}`;
                          const isExp = expandedScores.has(key);
                          const hasSub = !!parseSubScores((s as { sub_notes?: string }).sub_notes);
                          return (
                            <div key={s.category}
                              className={`rounded-xl border transition-all ${hasSub ? "cursor-pointer hover:border-opacity-60" : ""}`}
                              style={{ borderColor: isExp ? `${sc}40` : "#e2e8f0", background: isExp ? `${sc}06` : "#f8fafc", padding: "10px" }}
                              onClick={() => hasSub && toggleScore(key)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold text-slate-600">{CATEGORY_ICONS[s.category as keyof typeof CATEGORY_ICONS]}</div>
                                {hasSub && <span style={{ color: sc }}>{isExp ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</span>}
                              </div>
                              <div className="hub-label text-[10px] mt-0.5">{CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</div>
                              <div className="text-sm font-black tabular-nums mt-1" style={{ color: sc }}>{s.score.toFixed(1)}</div>
                              <div className="h-1 bg-hub-border rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.score * 10}%`, backgroundColor: sc }} />
                              </div>
                              {isExp && hasSub && (
                                <SubCriteriaBreakdown categoryId={s.category} subNotes={(s as { sub_notes?: string }).sub_notes} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {(arch || socio) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs text-slate-600">Inschatting:</span>
                        {arch && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{ background: `${arch.color}15`, color: arch.color }}>
                            {arch.icon} {arch.label}
                          </span>
                        )}
                        {socio && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{ background: `${socio.color_hex}15`, color: socio.color_hex }}>
                            {socio.icon} {socio.label}
                          </span>
                        )}
                      </div>
                    )}
                    {ev.notes && (
                      <div className="p-3 rounded-xl bg-hub-surface border border-hub-border text-xs text-slate-600 italic">
                        &ldquo;{ev.notes}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
              {!evals.length && (
                <div className="hub-card p-12 text-center">
                  <Target size={40} className="text-slate-700 mx-auto mb-3" />
                  <div className="text-slate-600 font-bold mb-2">Nog geen evaluaties</div>
                  <Link href={`/dashboard/coach/evaluations/new?player=${player.id}`}
                    className="hub-btn-primary inline-flex items-center gap-2 text-sm mt-3">
                    <Plus size={14} /> Eerste evaluatie maken
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* CHALLENGES TAB */}
      {activeTab === "challenges" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{player.challenges?.length ?? 0} challenges</div>
            <Link href="/dashboard/coach/challenges" className="hub-btn-ghost text-xs flex items-center gap-2">
              <Plus size={14} /> Challenge toewijzen
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(player.challenges ?? []).map((ch) => {
              const statusConfig = {
                open: { color: "#475569", label: "Open" },
                in_progress: { color: "#f59e0b", label: "Bezig" },
                completed: { color: "#4FA9E6", label: "Voltooid" },
                expired: { color: "#ef4444", label: "Verlopen" },
              }[ch.status];

              return (
                <div key={ch.id} className="hub-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{ch.title}</span>
                        <span className="hub-tag text-[10px]" style={{ color: statusConfig.color, background: `${statusConfig.color}15` }}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-black tabular-nums" style={{ color: statusConfig.color }}>
                      {ch.progress}%
                    </div>
                  </div>
                  <div className="h-2 bg-hub-border rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${ch.progress}%`, backgroundColor: statusConfig.color }} />
                  </div>
                  {/* Progress updater */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={0} max={100} step={5}
                      value={ch.progress}
                      onChange={(e) => updateChallengeProgress(ch.id, parseInt(e.target.value))}
                      disabled={updatingProgress === ch.id}
                      className="flex-1 accent-hub-teal"
                    />
                    {updatingProgress === ch.id && <Loader2 size={12} className="animate-spin text-hub-teal" />}
                  </div>
                  {ch.deadline && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
                      <Target size={11} />
                      Deadline: {formatDate(ch.deadline)}
                    </div>
                  )}
                </div>
              );
            })}
            {!(player.challenges?.length) && (
              <div className="hub-card p-12 text-center col-span-2">
                <Trophy size={40} className="text-slate-700 mx-auto mb-3" />
                <div className="text-slate-600 font-bold mb-2">Nog geen challenges</div>
                <Link href="/dashboard/coach/challenges" className="hub-btn-outline inline-flex items-center gap-2 text-sm mt-3">
                  <Plus size={14} /> Challenge toewijzen
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
