"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, AlertTriangle, Maximize2, ChevronRight, Info, HeartPulse,
} from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import {
  CATEGORY_LABELS, CATEGORY_COLORS, POSITION_LABELS, SORENESS_LOCATION_LABELS,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import type { Evaluation, EvaluationCategory, PlayerWithDetails, DailyCheckin } from "@/lib/types";

/* ───────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ───────────────────────────────────────────────────────────── */

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

interface MetricStats {
  mostRecent: number;
  avg14: number;
  avg30: number;
  series: number[]; // last 7 evaluations as small bar chart
  trend: "up" | "down" | "flat";
}

function buildMetric(
  evaluations: Evaluation[],
  category: EvaluationCategory,
): MetricStats {
  const sorted = [...evaluations].sort((a, b) => new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime());
  const series = sorted.slice(0, 7).reverse().map(ev => {
    const sc = ev.scores?.find(s => s.category === category)?.score;
    return sc ?? 0;
  });
  const filtered = series.filter(v => v > 0);

  const mostRecent = filtered[filtered.length - 1] ?? 0;

  // 14-day avg ≈ last 4 evaluations
  const avg14arr = filtered.slice(-4);
  const avg14 = avg14arr.length ? avg14arr.reduce((a, b) => a + b, 0) / avg14arr.length : 0;

  // 30-day avg ≈ last 7 evaluations
  const avg30 = filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;

  // trend
  const trend: "up" | "down" | "flat" =
    filtered.length >= 2
      ? filtered[filtered.length - 1] > filtered[filtered.length - 2] ? "up"
        : filtered[filtered.length - 1] < filtered[filtered.length - 2] ? "down" : "flat"
      : "flat";

  return { mostRecent, avg14, avg30, series, trend };
}

/* ───────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ───────────────────────────────────────────────────────────── */

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setUserName(profile?.full_name ?? "");
      }
      const data = await getMyPlayerData();
      setPlayer(data);

      // Load self-reported check-ins (last 14 days)
      if (data?.id) {
        const { data: c } = await supabase
          .from("daily_checkins")
          .select("*")
          .eq("player_id", data.id)
          .order("checkin_date", { ascending: false })
          .limit(14);
        setCheckins((c ?? []) as DailyCheckin[]);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--navy)" }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-12">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Welkom{userName ? `, ${userName.split(" ")[0]}` : ""}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          Vul je profiel in zodat je coach je kan evalueren.
        </p>
        <Link href="/onboarding" className="btn-primary">
          Profiel aanvullen <ChevronRight size={13} />
        </Link>
      </div>
    );
  }

  const evals = player.evaluations ?? [];
  const latestEval = evals[0];
  const age = calculateAge(player.date_of_birth);

  // Calculate overall recovery as inverse of how far below max scoring is
  const overall = latestEval?.overall_score ?? 0;
  const overallPct = overall ? Math.round(((overall - 5) / 5) * 100) : 0; // -100 to +100 vs. 5

  // Per-category metrics
  const categories: EvaluationCategory[] = ["techniek", "fysiek", "tactiek", "mentaal", "teamplay"];

  // ── Self-report metrics from daily_checkins ────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCheckin = checkins.find(c => c.checkin_date.slice(0, 10) === todayStr);
  const last7Checkins = checkins.slice(0, 7);

  function checkinMetric(field: keyof DailyCheckin): {
    mostRecent: number;
    avg7: number;
    avg14: number;
    series: number[];
  } | null {
    const values = checkins
      .map(c => c[field] as number | undefined)
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (!values.length) return null;
    const mostRecent = values[0];
    const avg7arr = values.slice(0, 7);
    const avg14arr = values.slice(0, 14);
    const avg7 = avg7arr.reduce((a, b) => a + b, 0) / avg7arr.length;
    const avg14 = avg14arr.reduce((a, b) => a + b, 0) / avg14arr.length;
    const series = checkins.slice(0, 7).reverse().map(c => (c[field] as number | undefined) ?? 0);
    return { mostRecent, avg7, avg14, series };
  }

  const sleepMetric = checkinMetric("sleep_quality");
  const recoveryMetric = checkinMetric("perceived_recovery");
  const sorenessMetric = checkinMetric("soreness");
  const moodMetric = checkinMetric("mood");

  // Soreness body locations (from latest check-in)
  const sorenessBodyParts = todayCheckin?.soreness_locations ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
      {/* ═══════════════════════ LEFT PROFILE SIDEBAR ═══════════════════════ */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Identity card */}
        <div className="card-lg" style={{ position: "relative", overflow: "hidden" }}>
          {/* Notched corner accent */}
          <div style={{
            position: "absolute", top: 0, right: 0, width: 36, height: 36,
            background: "linear-gradient(135deg, transparent 50%, var(--navy) 50%)",
            opacity: 0.05,
          }} />

          <div style={{ padding: "18px 18px 14px" }}>
            {/* Identity row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 10, overflow: "hidden",
                background: "var(--bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {player.avatar_url ? (
                  <Image src={player.avatar_url} alt="" width={56} height={56} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
                    {player.first_name?.[0]}{player.last_name?.[0]}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {player.first_name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {player.last_name}
                </div>
              </div>
            </div>

            {/* Position chip */}
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                padding: "3px 8px", borderRadius: 4,
                background: "var(--navy)", color: "#fff",
              }}>
                {player.position}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                padding: "3px 8px", borderRadius: 4,
                background: "rgba(77,174,229,0.12)", color: "var(--sfa-blue)",
                border: "1px solid rgba(77,174,229,0.25)",
              }}>
                OVR · {player.overall_rating}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }}>
            <div style={{ padding: "10px 0" }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                color: "var(--text-dim)", padding: "0 18px 6px", textTransform: "uppercase",
              }}>
                Profile
              </div>
            </div>
          </div>

          {/* Profile fields */}
          <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <ProfileRow label="Age" value={age ? `${age} years` : "—"} />
            <ProfileRow label="Date of Birth" value={player.date_of_birth ? formatDate(player.date_of_birth) : "—"} />
            <ProfileRow label="Nationality" value={player.nationality} />
            <ProfileRow label="Primary Position" value={POSITION_LABELS[player.position]} />
            <ProfileRow label="Squad Number" value={player.jersey_number ? String(player.jersey_number) : "—"} />
            <ProfileRow label="Club" value={player.club ?? player.team_name ?? "Schoonhoven Sports"} />
            <ProfileRow label="Evaluaties" value={String(evals.length)} />
          </div>
        </div>

        {/* Quick links */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            color: "var(--text-dim)", marginBottom: 10, textTransform: "uppercase",
          }}>
            Snelle Links
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { href: "/dashboard/player/card", label: "Player Card" },
              { href: "/dashboard/player/evaluations", label: "Evaluaties" },
              { href: "/dashboard/player/challenges", label: "Challenges" },
              { href: "/dashboard/player/analytics", label: "Analytics" },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 8px", borderRadius: 6, fontSize: 12,
                  color: "var(--text-2)", fontWeight: 500,
                }}
                className="hover:bg-[var(--bg)]"
              >
                {l.label} <ChevronRight size={12} style={{ color: "var(--text-dim)" }} />
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════ MAIN CONTENT ═══════════════════════ */}
      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              Performance Overview
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              Percentages tonen je recente score relatief tot het niveau-gemiddelde van 5/10.
            </p>
          </div>
          <Link
            href="/dashboard/player/evaluations"
            style={{
              fontSize: 11, color: "var(--text-muted)",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            <Info size={11} /> Bekijk evaluaties
          </Link>
        </div>

        {/* ── Row 1: Overall + 3 weekly metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          {/* Overall recovery (radar-like circular) */}
          <NotchedCard>
            <CardHeader title="Overall Recovery" sub="Aggregate of all metric scores" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Most Recent</span>
              <span
                style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
                  color: overallPct >= 0 ? "var(--green)" : "var(--red)",
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                {overallPct >= 0 ? "+" : ""}{overallPct}%
              </span>
            </div>

            <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>
              Relative Performance
            </div>

            {/* SVG radar polygon (5 spokes) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RadarMini
                values={categories.map(c => latestEval?.scores?.find(s => s.category === c)?.score ?? 0)}
                labels={categories.map(c => CATEGORY_LABELS[c])}
                colors={categories.map(c => CATEGORY_COLORS[c])}
              />
            </div>
          </NotchedCard>

          {/* Per-category weekly metrics (first 3) */}
          {categories.slice(0, 3).map(cat => {
            const m = buildMetric(evals, cat);
            const pct = m.mostRecent ? Math.round(((m.mostRecent - 5) / 5) * 100) : 0;
            const pct14 = m.avg14 ? Math.round(((m.avg14 - 5) / 5) * 100) : 0;
            const pct30 = m.avg30 ? Math.round(((m.avg30 - 5) / 5) * 100) : 0;
            const isWarning = pct < -25;
            return (
              <MetricTile
                key={cat}
                title={CATEGORY_LABELS[cat]}
                sub="Updated weekly"
                color={CATEGORY_COLORS[cat]}
                mostRecent={pct}
                avg14={pct14}
                avg30={pct30}
                series={m.series}
                warning={isWarning}
              />
            );
          })}
        </div>

        {/* ── Row 2 — Self-report metrics (uit dagelijkse check-in) ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 4 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-2)", textTransform: "uppercase" }}>
              Welzijn — uit jouw check-in
            </h2>
            <Link
              href="/dashboard/player/checkin"
              style={{
                fontSize: 11, fontWeight: 600,
                color: todayCheckin ? "var(--text-muted)" : "var(--sfa-blue)",
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 5,
                background: todayCheckin ? "transparent" : "rgba(77,174,229,0.1)",
                border: `1px solid ${todayCheckin ? "var(--border)" : "rgba(77,174,229,0.3)"}`,
              }}
            >
              <HeartPulse size={11} /> {todayCheckin ? "Check-in aanpassen" : "Check-in invullen"}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <CheckinMetricTile
              title="Slaapkwaliteit"
              sub="Eigen rapportage"
              color="#7C3AED"
              metric={sleepMetric}
            />
            <CheckinMetricTile
              title="Perceived Recovery"
              sub="Hoe hersteld voel je je?"
              color="#16A34A"
              metric={recoveryMetric}
            />
            <CheckinMetricTile
              title="Spierpijn"
              sub="Hoeveel last?"
              color="#DC2626"
              metric={sorenessMetric}
              inverted
            />
            <CheckinMetricTile
              title="Stemming"
              sub="Mentale gesteldheid"
              color="#D97706"
              metric={moodMetric}
            />
          </div>
        </div>

        {/* ── Row 3 — Coach-input categorieën + body diagram ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-2)", textTransform: "uppercase" }}>
              Beoordeling — uit coach evaluatie
            </h2>
            {latestEval && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Laatst beoordeeld op {formatDate(latestEval.evaluation_date)}
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {(["mentaal", "teamplay"] as EvaluationCategory[]).map(cat => {
              const m = buildMetric(evals, cat);
              const pct = m.mostRecent ? Math.round(((m.mostRecent - 5) / 5) * 100) : 0;
              const pct14 = m.avg14 ? Math.round(((m.avg14 - 5) / 5) * 100) : 0;
              const pct30 = m.avg30 ? Math.round(((m.avg30 - 5) / 5) * 100) : 0;
              return (
                <MetricTile
                  key={cat}
                  title={CATEGORY_LABELS[cat]}
                  sub="Score uit laatste evaluatie"
                  color={CATEGORY_COLORS[cat]}
                  mostRecent={pct}
                  avg14={pct14}
                  avg30={pct30}
                  series={m.series}
                  warning={pct < -10}
                />
              );
            })}

            {/* Soreness body diagram from check-in */}
            <NotchedCard>
              <CardHeader
                title="Pijnpunten"
                sub={todayCheckin ? "Uit jouw check-in vandaag" : "Vul check-in in om te tonen"}
              />
              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                <BodyDiagram highlightedLocations={sorenessBodyParts} />
              </div>
              {sorenessBodyParts.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {sorenessBodyParts.map(loc => (
                    <span key={loc} style={{
                      fontSize: 10, fontWeight: 600,
                      padding: "2px 7px", borderRadius: 4,
                      background: "rgba(220,38,38,0.1)", color: "var(--red)",
                      border: "1px solid rgba(220,38,38,0.2)",
                    }}>
                      {SORENESS_LOCATION_LABELS[loc]}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 6 }}>
                  {todayCheckin
                    ? "Geen pijnpunten gerapporteerd vandaag — top!"
                    : "Markeer pijnpunten in je dagelijkse check-in zodat je coach het ziet."}
                </p>
              )}
            </NotchedCard>
          </div>
        </div>

        {/* Footer — datum laatste evaluatie */}
        {latestEval && (
          <div style={{
            marginTop: 4, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 11, color: "var(--text-muted)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            Laatst bijgewerkt op {formatDate(latestEval.evaluation_date)}
            {latestEval.coach_name && <span> · door {latestEval.coach_name}</span>}
          </div>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/*  Sub-components                                               */
/* ───────────────────────────────────────────────────────────── */

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function NotchedCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        position: "relative",
      }}
    >
      {/* Bottom-right notch */}
      <div
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 14,
          height: 14,
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
          borderTopLeftRadius: 3,
        }}
      />
      {children}
    </div>
  );
}

function CardHeader({ title, sub, warning }: { title: string; sub?: string; warning?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</h3>
          {warning && <AlertTriangle size={13} style={{ color: "var(--amber)" }} />}
        </div>
        {sub && <p style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 1, fontStyle: "italic" }}>{sub}</p>}
      </div>
      <button style={{
        width: 22, height: 22, borderRadius: 4,
        border: "none", background: "transparent",
        color: "var(--text-dim)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Maximize2 size={11} />
      </button>
    </div>
  );
}

function MetricTile({
  title, sub, color, mostRecent, avg14, avg30, series, warning, period,
}: {
  title: string;
  sub?: string;
  color: string;
  mostRecent: number;
  avg14: number;
  avg30: number;
  series: number[];
  warning?: boolean;
  period?: [string, string];
}) {
  const labels = period ?? ["14-Day Avg.", "30-Day Avg."];
  return (
    <NotchedCard>
      <CardHeader title={title} sub={sub} warning={warning} />

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Most Recent</span>
        <span
          style={{
            fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
            color: mostRecent >= 0 ? "var(--green)" : "var(--red)",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {mostRecent >= 0 ? "+" : ""}{mostRecent}%
        </span>
      </div>

      {/* Mini bar chart */}
      <MiniBars series={series} color={color} />

      {/* Averages */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <AvgRow label={labels[0]} value={avg14} />
        <AvgRow label={labels[1]} value={avg30} />
      </div>
    </NotchedCard>
  );
}

function AvgRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <span
        style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em",
          color: value >= 0 ? "var(--green)" : "var(--red)",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value >= 0 ? "+" : ""}{value}%
      </span>
    </div>
  );
}

function MiniBars({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(...series, 10);
  const avg = series.length ? series.filter(v => v > 0).reduce((a, b) => a + b, 0) / series.filter(v => v > 0).length : 0;

  // Normalize to delta from 5 (mid-point), so bars can go up or down from a baseline
  const baseline = 50; // px
  const heightTotal = 56;

  return (
    <div style={{ position: "relative", height: heightTotal, display: "flex", alignItems: "flex-end", gap: 3 }}>
      {/* Avg dotted line */}
      <div
        style={{
          position: "absolute",
          left: 0, right: 0,
          bottom: `${(avg / max) * heightTotal}px`,
          height: 1,
          borderTop: "1px dashed var(--border-strong)",
          pointerEvents: "none",
        }}
      />
      <span style={{
        position: "absolute",
        right: 0,
        bottom: `${(avg / max) * heightTotal + 2}px`,
        fontSize: 9,
        color: "var(--text-dim)",
        letterSpacing: "0.04em",
        textTransform: "lowercase",
      }}>
        avg.
      </span>

      {Array.from({ length: 7 }).map((_, i) => {
        const v = series[i] ?? 0;
        const isLatest = i === series.length - 1 && v > 0;
        const h = v ? Math.max((v / max) * heightTotal, 4) : 6;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              borderRadius: 2,
              background: isLatest ? color : v > 0 ? `${color}55` : "var(--border)",
              transition: "all 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

function RadarMini({ values, labels, colors }: { values: number[]; labels: string[]; colors: string[] }) {
  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const R = 48;
  const n = values.length;

  const points = values.map((v, i) => {
    const ratio = Math.max(0, Math.min(1, v / 10));
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * R * ratio,
      y: cy + Math.sin(angle) * R * ratio,
    };
  });

  const labelPoints = labels.map((_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * (R + 12),
      y: cy + Math.sin(angle) * (R + 12),
    };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[0.33, 0.66, 1].map(ring => (
        <circle
          key={ring}
          cx={cx}
          cy={cy}
          r={R * ring}
          fill="none"
          stroke="var(--border)"
          strokeDasharray="2 3"
          strokeWidth={0.8}
        />
      ))}

      {/* Spokes */}
      {Array.from({ length: n }).map((_, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(angle) * R}
            y2={cy + Math.sin(angle) * R}
            stroke="var(--border)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Filled polygon */}
      <path d={path} fill="rgba(77,174,229,0.25)" stroke="#4DAEE5" strokeWidth={1.5} />

      {/* Vertices */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={colors[i]} stroke="#fff" strokeWidth={1} />
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          fontSize={7}
          fill="var(--text-muted)"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontWeight: 600, letterSpacing: "0.04em" }}
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

function BodyDiagram({ highlightedLocations }: {
  highlightedLocations?: string[];
}) {
  // Map soreness locations to coordinates on the body silhouette
  const locMap: Record<string, { x: number; y: number; r: number }> = {
    neck:       { x: 30, y: 22, r: 3 },
    shoulders:  { x: 22, y: 28, r: 3 },
    upper_back: { x: 30, y: 35, r: 5 },
    lower_back: { x: 30, y: 55, r: 5 },
    core:       { x: 30, y: 50, r: 4 },
    groin:      { x: 30, y: 68, r: 3 },
    quads:      { x: 26, y: 85, r: 4 },
    hamstring:  { x: 34, y: 95, r: 4 },
    knees:      { x: 30, y: 102, r: 3 },
    calves:     { x: 30, y: 115, r: 4 },
    ankles:     { x: 30, y: 125, r: 2 },
    feet:       { x: 30, y: 132, r: 2 },
  };

  const locations = highlightedLocations ?? [];

  return (
    <svg width={120} height={150} viewBox="0 0 60 150">
      {/* Head */}
      <circle cx={30} cy={14} r={7} fill="none" stroke="var(--border-strong)" strokeWidth={1} />
      {/* Body */}
      <path
        d="M 22 22 L 38 22 L 40 30 L 42 60 L 40 80 L 36 130 L 32 130 L 32 90 L 28 90 L 28 130 L 24 130 L 20 80 L 18 60 L 20 30 Z"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={1}
      />
      {/* Arms */}
      <path
        d="M 18 30 L 12 60 L 10 78 M 42 30 L 48 60 L 50 78"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={1}
      />

      {/* Highlighted soreness spots */}
      {locations.map(loc => {
        const b = locMap[loc];
        if (!b) return null;
        return (
          <g key={loc}>
            <circle cx={b.x} cy={b.y} r={b.r + 2} fill="rgba(220,38,38,0.2)" />
            <circle cx={b.x} cy={b.y} r={b.r} fill="#DC2626" />
          </g>
        );
      })}
    </svg>
  );
}

function CheckinMetricTile({
  title, sub, color, metric, inverted,
}: {
  title: string;
  sub?: string;
  color: string;
  metric: { mostRecent: number; avg7: number; avg14: number; series: number[] } | null;
  inverted?: boolean;
}) {
  if (!metric) {
    return (
      <NotchedCard>
        <CardHeader title={title} sub={sub} />
        <div style={{
          padding: "20px 0",
          textAlign: "center",
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}>
          Nog geen check-in data.
          <br />
          <Link href="/dashboard/player/checkin" style={{ color: "var(--sfa-blue)", fontWeight: 600 }}>
            Vul nu in →
          </Link>
        </div>
      </NotchedCard>
    );
  }

  // For "inverted" (soreness, stress) we show 1-3 = good, 4-6 = ok, 7-10 = bad
  // Convert to a delta-style % vs midpoint of 5
  const valueColor = inverted
    ? metric.mostRecent <= 3 ? "var(--green)" : metric.mostRecent <= 6 ? "var(--amber)" : "var(--red)"
    : metric.mostRecent >= 7 ? "var(--green)" : metric.mostRecent >= 4 ? "var(--amber)" : "var(--red)";

  return (
    <NotchedCard>
      <CardHeader title={title} sub={sub} />

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Vandaag</span>
        <span
          style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            color: valueColor, fontFeatureSettings: '"tnum" 1', lineHeight: 1,
          }}
        >
          {metric.mostRecent}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-dim)" }}>/10</span>
        </span>
      </div>

      {/* Mini bar chart of last 7 days */}
      <CheckinBars series={metric.series} color={color} inverted={inverted} />

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
        <AvgRowSimple label="7-dagen gem." value={metric.avg7} color={color} />
        <AvgRowSimple label="14-dagen gem." value={metric.avg14} color={color} />
      </div>
    </NotchedCard>
  );
}

function CheckinBars({ series, color, inverted }: { series: number[]; color: string; inverted?: boolean }) {
  const heightTotal = 50;
  return (
    <div style={{ position: "relative", height: heightTotal, display: "flex", alignItems: "flex-end", gap: 3 }}>
      {Array.from({ length: 7 }).map((_, i) => {
        const v = series[i] ?? 0;
        const isLatest = i === series.length - 1 && v > 0;
        const h = v ? Math.max((v / 10) * heightTotal, 4) : 4;
        const segColor = inverted
          ? v <= 3 ? "var(--green)" : v <= 6 ? "var(--amber)" : "var(--red)"
          : v >= 7 ? "var(--green)" : v >= 4 ? "var(--amber)" : "var(--red)";
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              borderRadius: 2,
              background: v > 0 ? (isLatest ? color : `${segColor}aa`) : "var(--border)",
              transition: "all 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

function AvgRowSimple({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        fontFeatureSettings: '"tnum" 1',
      }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
