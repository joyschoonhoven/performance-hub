"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Loader2, Swords, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface MatchRow {
  id: string;
  match_date: string;
  opponent: string;
  competition: string | null;
  home_away: "home" | "away" | null;
  result: string | null;
  notes: string | null;
}

export default function CoachMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [mRes, sRes] = await Promise.all([
        supabase.from("matches").select("*").order("match_date", { ascending: false }),
        supabase.from("match_player_stats").select("match_id"),
      ]);
      setMatches((mRes.data ?? []) as MatchRow[]);
      const counts: Record<string, number> = {};
      (sRes.data ?? []).forEach((s: { match_id: string }) => {
        counts[s.match_id] = (counts[s.match_id] ?? 0) + 1;
      });
      setPlayerCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--sfa-blue)" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
            Wedstrijden
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {matches.length === 0
              ? "Nog geen wedstrijden vastgelegd."
              : `${matches.length} wedstrijd${matches.length === 1 ? "" : "en"}`}
          </p>
        </div>
        <Link href="/dashboard/coach/matches/new" className="btn-primary">
          <Plus size={13} /> Wedstrijd loggen
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="card" style={{ padding: "60px 32px", textAlign: "center", marginTop: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(27,108,168,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px", color: "var(--sfa-blue)",
          }}>
            <Swords size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Begin met loggen
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto 20px", lineHeight: 1.55 }}>
            Vul na elke wedstrijd de tegenstander, uitslag en per-speler statistieken in.
            Deze data voedt automatisch de Player Card en analytics.
          </p>
          <Link href="/dashboard/coach/matches/new" className="btn-primary">
            Eerste wedstrijd loggen <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 140px 100px 110px",
            gap: 12, padding: "12px 20px",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-dim)", textTransform: "uppercase",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
          }}>
            <span>Datum</span>
            <span>Tegenstander</span>
            <span>Competitie</span>
            <span>Uitslag</span>
            <span>Spelers</span>
          </div>
          {matches.map((m, i) => {
            const playerN = playerCounts[m.id] ?? 0;
            const parts = (m.result ?? "—-—").split("-");
            const a = parseInt(parts[0]);
            const b = parseInt(parts[1]);
            const homeAway = m.home_away ?? "home";
            const our = !isNaN(a) && !isNaN(b) ? (homeAway === "home" ? a : b) : null;
            const their = !isNaN(a) && !isNaN(b) ? (homeAway === "home" ? b : a) : null;
            const outcome = our !== null && their !== null
              ? our > their ? "W" : our === their ? "G" : "V"
              : "—";
            const outColor = outcome === "W" ? "var(--green)"
              : outcome === "G" ? "var(--amber)"
              : outcome === "V" ? "var(--sfa-red)"
              : "var(--text-dim)";
            return (
              <div key={m.id} style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 140px 100px 110px",
                gap: 12, padding: "14px 20px",
                alignItems: "center", fontSize: 12.5,
                borderBottom: i < matches.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}>
                  <Calendar size={12} />
                  {formatDate(m.match_date)}
                </div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>
                  {m.opponent}
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 500, marginLeft: 6 }}>
                    {homeAway === "home" ? "(thuis)" : "(uit)"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {m.competition ?? "—"}
                </span>
                <span style={{
                  fontWeight: 700, fontFamily: '"JetBrains Mono", monospace',
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    padding: "2px 5px", borderRadius: 3,
                    background: `${outColor}22`, color: outColor,
                  }}>
                    {outcome}
                  </span>
                  {m.result ?? "—"}
                </span>
                <span style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono", monospace' }}>
                  {playerN > 0 ? `${playerN} speler${playerN === 1 ? "" : "s"}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
