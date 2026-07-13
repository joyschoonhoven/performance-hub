"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { POSITION_LABELS, POTENTIAL_LEVELS, CATEGORY_LABELS } from "@/lib/types";
import {
  Search, TrendingUp, TrendingDown, Minus, Loader2, UserPlus, Mail,
  LayoutGrid, List, ChevronRight,
} from "lucide-react";
import type { PositionType, PlayerWithDetails, EvaluationCategory } from "@/lib/types";
import { getAllPlayers } from "@/lib/supabase/queries";
import { MbtiShield } from "@/components/ui/ShieldBadge";

const ACCENT = "#5A90BA";
const LINE = "#E5E7EB";

type SortKey = "rating" | "name" | "position";
type FilterPosition = PositionType | "all";
type ViewMode = "scout" | "lijst";

/* Cijferkleur naar niveau — zelfde conventie als de Player Card */
function scoreColor(v: number): string {
  if (v >= 8) return "#2E7D4F";
  if (v >= 6.5) return "#C9A227";
  if (v >= 5) return "#D07A2E";
  return "#B4534A";
}

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<FilterPosition>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [view, setView] = useState<ViewMode>("scout");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  useEffect(() => {
    getAllPlayers().then((data) => { setAllPlayers(data); setLoading(false); });
    const saved = localStorage.getItem("coach-players-view");
    if (saved === "lijst" || saved === "scout") setView(saved);
  }, []);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem("coach-players-view", v);
  }

  async function inviteMbti() {
    setInviting(true); setInviteMsg(null);
    try {
      const r = await fetch("/api/invite-mbti", { method: "POST" });
      const d = await r.json();
      setInviteMsg(r.ok ? `${d.invited} uitgenodigd · ${d.emailed} e-mails verstuurd` : `Mislukt: ${d.error}`);
    } catch (e) {
      setInviteMsg(`Fout: ${e instanceof Error ? e.message : "netwerk"}`);
    }
    setInviting(false);
    setTimeout(() => setInviteMsg(null), 6000);
  }

  const positions = useMemo(() => Array.from(new Set(allPlayers.map((p) => p.position))), [allPlayers]);

  const filtered = useMemo(() => {
    let result = [...allPlayers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
      );
    }
    if (positionFilter !== "all") {
      result = result.filter((p) => p.position === positionFilter);
    }
    result.sort((a, b) => {
      if (sortKey === "rating") return b.overall_rating - a.overall_rating;
      if (sortKey === "name") return a.last_name.localeCompare(b.last_name);
      return a.position.localeCompare(b.position);
    });
    return result;
  }, [search, positionFilter, sortKey, allPlayers]);

  // Selectie geldig houden bij filteren
  useEffect(() => {
    if (!filtered.length) { setSelectedId(null); return; }
    if (!selectedId || !filtered.some((p) => p.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected = filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={26} className="animate-spin" style={{ color: ACCENT }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1180, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
        .pl-card { transition: border-color 0.15s, box-shadow 0.15s; }
        .pl-card:hover { border-color: var(--border-strong); box-shadow: 0 2px 10px rgba(31,41,55,0.06); }
        .scout-wrap { display: grid; grid-template-columns: 1.05fr 1fr; gap: 16px; align-items: start; }
        .scout-rows { display: grid; grid-template-columns: 1fr 1fr; }
        .scout-row { transition: background 0.12s; }
        .scout-row:hover { background: var(--surface-2, #F7F8FA); }
        @media (max-width: 1023px) { .scout-wrap { grid-template-columns: 1fr; } }
        @media (max-width: 560px)  { .scout-rows { grid-template-columns: 1fr; } }
      ` }} />

      {/* ── Kop ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="display-font" style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", lineHeight: 1.1 }}>Spelers</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            {allPlayers.length} speler{allPlayers.length !== 1 ? "s" : ""} in de selectie
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {inviteMsg && (
            <span style={{ fontSize: 12, fontWeight: 500, color: inviteMsg.startsWith("Mislukt") || inviteMsg.startsWith("Fout") ? "var(--red)" : "var(--green)" }}>
              {inviteMsg}
            </span>
          )}
          <button onClick={inviteMbti} disabled={inviting} className="cut-btn display-font" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            height: 40, padding: "0 22px",
            background: "var(--surface-2)", border: "1px solid var(--border-strong)",
            color: "var(--text-2)", fontSize: 12.5, fontWeight: 600,
            cursor: inviting ? "default" : "pointer", opacity: inviting ? 0.6 : 1,
          }}>
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Uitnodigen voor test
          </button>
        </div>
      </div>

      {allPlayers.length === 0 ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "48px 24px", textAlign: "center", maxWidth: 440, margin: "24px auto",
        }}>
          <UserPlus size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Nog geen spelers</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Zodra spelers zich registreren en hun profiel invullen, verschijnen ze hier.
          </p>
        </div>
      ) : (
        <>
          {/* ── Filters + weergave-schakelaar ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam of positie"
                style={{
                  width: "100%", height: 36, boxSizing: "border-box",
                  padding: "0 12px 0 32px", borderRadius: 8, fontSize: 13,
                  background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <PosPill label="Alle" active={positionFilter === "all"} onClick={() => setPositionFilter("all")} />
              {positions.map((pos) => (
                <PosPill key={pos} label={pos} active={positionFilter === pos} onClick={() => setPositionFilter(pos)} />
              ))}
            </div>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{
                height: 36, padding: "0 10px", borderRadius: 8, fontSize: 12.5,
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text-2)", outline: "none", cursor: "pointer",
              }}
            >
              <option value="rating">Rating</option>
              <option value="name">Naam</option>
              <option value="position">Positie</option>
            </select>

            {/* Weergave-schakelaar (zoals macOS Finder) */}
            <div style={{
              display: "flex", alignItems: "center", height: 36,
              background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
              overflow: "hidden",
            }}>
              {([["scout", <LayoutGrid key="g" size={14} />], ["lijst", <List key="l" size={14} />]] as [ViewMode, React.ReactNode][]).map(([v, ic]) => (
                <button key={v} onClick={() => switchView(v)} title={v === "scout" ? "Scout-weergave" : "Compacte lijst"}
                  style={{
                    height: "100%", padding: "0 12px", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center",
                    background: view === v ? ACCENT : "transparent",
                    color: view === v ? "#fff" : "var(--text-dim)",
                    transition: "background 0.15s",
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
              padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Geen spelers gevonden</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Pas de zoekopdracht of het positiefilter aan.</div>
            </div>
          ) : view === "scout" ? (

            /* ══ SCOUT-WEERGAVE — resultaten links, rapport rechts ══ */
            <div className="scout-wrap">
              {/* Resultaten */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div className="club-h" style={{ fontSize: 12.5, color: "var(--text)", padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                  Zoekresultaten
                </div>
                <div className="scout-rows">
                  {filtered.map((p) => {
                    const isSel = selected?.id === p.id;
                    const age = calcAge(p.date_of_birth);
                    return (
                      <button key={p.id} onClick={() => setSelectedId(p.id)} className="scout-row" style={{
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        padding: "12px 14px", cursor: "pointer",
                        background: isSel ? `${ACCENT}0D` : "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--border)",
                        boxShadow: isSel ? `inset 0 0 0 1.5px ${ACCENT}` : "none",
                      }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                          background: "var(--surface-2)", border: `1px solid ${LINE}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {p.photo_url || p.avatar_url
                            ? <Image src={(p.photo_url ?? p.avatar_url)!} alt="" width={46} height={46} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                            : <span className="display-font" style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>{p.first_name[0]}{p.last_name?.[0] ?? ""}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em" }}>{p.first_name}</div>
                          <div className="display-font" style={{
                            fontSize: 15, fontWeight: 600, color: "var(--text)", textTransform: "uppercase",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {p.last_name || p.first_name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {age !== null ? `Leeftijd ${age}` : "—"} <span style={{ color: "var(--text-dim)" }}>|</span> {p.position}
                          </div>
                        </div>
                        {p.mbti_type
                          ? <MbtiShield code={p.mbti_type} size={24} />
                          : <span className="display-font" style={{ fontSize: 14, fontWeight: 600, color: scoreColor(p.overall_rating / 10) }}>{p.overall_rating}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spelersrapport */}
              {selected && <ScoutReport player={selected} />}
            </div>

          ) : (

            /* ══ COMPACTE LIJST — bestaande kaartweergave ══ */
            <div className="pl-grid">
              {filtered.map((p) => {
                const trend = p.trend ?? "stable";
                const evalCount = p.evaluations?.length ?? 0;
                return (
                  <Link key={p.id} href={`/dashboard/coach/players/${p.id}`} className="pl-card" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                    padding: 14, textDecoration: "none",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0,
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: ACCENT,
                    }}>
                      {p.avatar_url
                        ? <Image src={p.avatar_url} alt={p.first_name} width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        : `${p.first_name[0]}${p.last_name[0]}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13.5, fontWeight: 600, color: "var(--text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {p.first_name} {p.last_name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        {POSITION_LABELS[p.position]}
                        <span style={{ color: "var(--text-dim)" }}>·</span>
                        {evalCount} evaluatie{evalCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {p.mbti_type && <MbtiShield code={p.mbti_type} size={24} />}
                      {trend === "up" ? <TrendingUp size={13} style={{ color: "var(--green)" }} />
                        : trend === "down" ? <TrendingDown size={13} style={{ color: "var(--red)" }} />
                        : <Minus size={13} style={{ color: "var(--text-dim)" }} />}
                      <span className="display-font" style={{
                        fontSize: 19, fontWeight: 600, color: "var(--text)",
                        fontFeatureSettings: '"tnum" 1',
                      }}>
                        {p.overall_rating}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══ Spelersrapport — rechterpaneel in scout-weergave ══ */
function ScoutReport({ player }: { player: PlayerWithDetails }) {
  const age = calcAge(player.date_of_birth);
  const photo = player.photo_url ?? player.avatar_url ?? null;
  const latest = player.evaluations?.[0];
  const potential = latest?.potential_level ? POTENTIAL_LEVELS.find((p) => p.value === latest.potential_level)?.label : null;
  const scores = player.recent_scores as Partial<Record<EvaluationCategory, number>> | undefined;
  const evalCount = player.evaluations?.length ?? 0;
  const doneCh = player.challenges?.filter((c) => c.status === "completed").length ?? 0;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Actieknop */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 14px 0" }}>
        <Link href={`/dashboard/coach/players/${player.id}`} className="cut-btn display-font" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 36, padding: "0 18px", background: ACCENT, color: "#fff",
          fontSize: 12, fontWeight: 600, textDecoration: "none",
        }}>
          Volledig profiel <ChevronRight size={13} />
        </Link>
      </div>

      {/* Kop */}
      <div style={{ display: "flex", gap: 16, padding: "10px 18px 16px", alignItems: "flex-start" }}>
        <div style={{
          width: 88, height: 88, borderRadius: 10, overflow: "hidden", flexShrink: 0,
          background: "var(--surface-2)", border: `1px solid ${LINE}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photo
            ? <Image src={photo} alt="" width={88} height={88} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : <span className="display-font" style={{ fontSize: 26, fontWeight: 600, color: ACCENT }}>{player.first_name[0]}{player.last_name?.[0] ?? ""}</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="display-font" style={{ fontSize: 28, fontWeight: 600, color: scoreColor(player.overall_rating / 10), lineHeight: 1 }}>
              {player.overall_rating}
            </span>
            <span className="display-font" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              {player.position}{player.secondary_position ? ` · ${player.secondary_position}` : ""}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginTop: 6 }}>{player.first_name}</div>
          <div className="display-font" style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", lineHeight: 1.05 }}>
            {player.last_name || player.first_name}
          </div>

          {/* Metarij */}
          <div style={{ display: "flex", gap: 0, marginTop: 10, flexWrap: "wrap", border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" }}>
            {[
              { k: "Potentieel", v: potential ?? "—", c: ACCENT },
              { k: "Leeftijd", v: age !== null ? String(age) : "—" },
              { k: "Lengte", v: player.height_cm ? `${player.height_cm} cm` : "—" },
              { k: "Voet", v: player.dominant_foot === "left" ? "L" : player.dominant_foot === "both" ? "L/R" : player.dominant_foot === "right" ? "R" : "—" },
            ].map((m, i) => (
              <div key={m.k} style={{ padding: "7px 12px", borderLeft: i ? `1px solid ${LINE}` : "none", flex: 1, minWidth: 70 }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", color: "var(--text-dim)", textTransform: "uppercase" }}>{m.k}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: m.c ?? "var(--text)", marginTop: 2, whiteSpace: "nowrap" }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Club + type */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Image src="/logo.png" alt="SFA" width={40} height={40} style={{ objectFit: "contain" }} />
          {player.mbti_type && <MbtiShield code={player.mbti_type} size={40} />}
        </div>
      </div>

      {/* Samenvatting */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: "14px 18px 18px" }}>
        <div className="club-h" style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 10 }}>Samenvatting</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px" }}>
          {/* Scores */}
          <div>
            {(Object.keys(CATEGORY_LABELS) as EvaluationCategory[]).map((cat) => {
              const v = scores?.[cat];
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{CATEGORY_LABELS[cat]}</span>
                  <span className="display-font" style={{ fontSize: 15, fontWeight: 600, color: v ? scoreColor(v) : "var(--text-dim)", fontFeatureSettings: '"tnum" 1' }}>
                    {v ? v.toFixed(1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Rechterkolom */}
          <div>
            {[
              { k: "Evaluaties", v: String(evalCount) },
              { k: "Challenges voltooid", v: String(doneCh) },
              { k: "Persoonlijkheid", v: player.mbti_type ?? "Geen test" },
              { k: "Trend", v: player.trend === "up" ? "Stijgend" : player.trend === "down" ? "Dalend" : "Stabiel" },
              { k: "Status", v: player.is_active ? "Actief" : "Inactief" },
            ].map((row) => (
              <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{row.k}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Positiefilter-knop ── */
function PosPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="pl-pill cut-sm display-font" style={{
      height: 30, padding: "0 14px",
      fontSize: 11.5, fontWeight: 600, cursor: "pointer",
      background: active ? ACCENT : "var(--surface-2)",
      border: `1px solid ${active ? ACCENT : "var(--border)"}`,
      color: active ? "#fff" : "var(--text-2)",
    }}>
      {label}
    </button>
  );
}
