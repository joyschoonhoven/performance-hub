"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { POSITION_LABELS } from "@/lib/types";
import { Search, TrendingUp, TrendingDown, Minus, Loader2, UserPlus, Mail } from "lucide-react";
import type { PositionType, PlayerWithDetails } from "@/lib/types";
import { getAllPlayers } from "@/lib/supabase/queries";

const ACCENT = "#5A90BA";

type SortKey = "rating" | "name" | "position";
type FilterPosition = PositionType | "all";

export default function PlayersPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<FilterPosition>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  useEffect(() => {
    getAllPlayers().then((data) => { setAllPlayers(data); setLoading(false); });
  }, []);

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

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={26} className="animate-spin" style={{ color: ACCENT }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1080, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
        .pl-card { transition: border-color 0.15s, box-shadow 0.15s; }
        .pl-card:hover { border-color: var(--border-strong); box-shadow: 0 2px 10px rgba(31,41,55,0.06); }
        .pl-pill { transition: all 0.15s; }
      ` }} />

      {/* ── Header ── */}
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
          {/* ── Filters ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
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
          </div>

          {/* ── Spelerskaarten ── */}
          {filtered.length === 0 ? (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
              padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Geen spelers gevonden</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Pas de zoekopdracht of het positiefilter aan.</div>
            </div>
          ) : (
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
                    {/* Avatar */}
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

                    {/* Naam + positie */}
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

                    {/* Trend + rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
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
