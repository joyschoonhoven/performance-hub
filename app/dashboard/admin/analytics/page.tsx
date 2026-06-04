import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Users, ClipboardList, Trophy, Target, Activity, Calendar } from "lucide-react";
import { POSITION_LABELS } from "@/lib/types";
import type { PositionType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  const [
    { data: players },
    { data: evaluations },
    { data: profiles },
    { data: agreements },
    { data: challenges },
  ] = await Promise.all([
    supabase.from("players").select("id, position, team_name, overall_rating, created_at").eq("is_active", true),
    supabase.from("evaluations").select("id, created_at, overall_score, assessed_position").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role, created_at"),
    supabase.from("plan_agreements").select("id, status, category, created_at"),
    supabase.from("challenges").select("id, status, created_at").limit(200),
  ]);

  const allPlayers = players ?? [];
  const allEvals = evaluations ?? [];
  const allProfiles = profiles ?? [];
  const allAgreements = agreements ?? [];
  const allChallenges = challenges ?? [];

  // Position distribution
  const positionDist: Partial<Record<PositionType, number>> = {};
  allPlayers.forEach((p) => {
    const pos = p.position as PositionType;
    positionDist[pos] = (positionDist[pos] ?? 0) + 1;
  });
  const positionRanked = (Object.entries(positionDist) as [PositionType, number][])
    .sort((a, b) => b[1] - a[1]);
  const maxPos = Math.max(...positionRanked.map(([, c]) => c), 1);

  // Rating distribution buckets
  const ratingBuckets: Record<string, number> = { "50-59": 0, "60-69": 0, "70-79": 0, "80-89": 0, "90+": 0 };
  allPlayers.forEach((p) => {
    const r = p.overall_rating ?? 65;
    if (r >= 90) ratingBuckets["90+"]++;
    else if (r >= 80) ratingBuckets["80-89"]++;
    else if (r >= 70) ratingBuckets["70-79"]++;
    else if (r >= 60) ratingBuckets["60-69"]++;
    else ratingBuckets["50-59"]++;
  });
  const maxRating = Math.max(...Object.values(ratingBuckets), 1);

  // Agreement status
  const agreementStatus = { open: 0, in_progress: 0, completed: 0, missed: 0 };
  allAgreements.forEach((a) => {
    const s = a.status as keyof typeof agreementStatus;
    if (s in agreementStatus) agreementStatus[s]++;
  });
  const agreementTotal = allAgreements.length;
  const completionRate = agreementTotal ? Math.round((agreementStatus.completed / agreementTotal) * 100) : 0;

  // Monthly evals (last 6 months)
  const now = new Date();
  const monthlyEvals: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" });
    const count = allEvals.filter((e) => {
      const ed = new Date(e.created_at);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    }).length;
    monthlyEvals.push({ month: label, count });
  }
  const maxMonthly = Math.max(...monthlyEvals.map((m) => m.count), 1);

  // Avg rating
  const avgRating = allPlayers.length
    ? (allPlayers.reduce((a, p) => a + (p.overall_rating ?? 65), 0) / allPlayers.length).toFixed(1)
    : "—";

  // Role counts
  const coachCount = allProfiles.filter((p) => p.role === "coach").length;
  const playerCount = allProfiles.filter((p) => p.role === "player").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#001B48", fontFamily: "Outfit, sans-serif" }}>
          Platform Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Overzicht van gebruik, spelers en activiteit op het platform.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Actieve spelers", value: allPlayers.length, icon: <Users size={18} />, color: "#4FA9E6" },
          { label: "Coaches", value: coachCount, icon: <Target size={18} />, color: "#f59e0b" },
          { label: "Totaal evaluaties", value: allEvals.length, icon: <ClipboardList size={18} />, color: "#a78bfa" },
          { label: "Gem. rating", value: avgRating, icon: <TrendingUp size={18} />, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="hub-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            </div>
            <div className="text-3xl font-black tabular-nums" style={{ fontFamily: "Oswald, sans-serif", color: "#001B48" }}>
              {s.value}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly evaluations */}
        <div className="hub-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={15} style={{ color: "#4FA9E6" }} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evaluaties per maand</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {monthlyEvals.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color: "#4FA9E6" }}>{m.count || ""}</span>
                <div className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max((m.count / maxMonthly) * 100, m.count > 0 ? 8 : 2)}%`,
                    background: m.count > 0 ? "linear-gradient(180deg, #4FA9E6, #2B8AC7)" : "rgba(79,169,230,0.12)",
                    minHeight: 3,
                  }} />
                <span className="text-[10px] text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="hub-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={15} style={{ color: "#f59e0b" }} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rating verdeling</span>
          </div>
          <div className="space-y-3">
            {Object.entries(ratingBuckets).map(([bucket, count]) => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-12 text-right">{bucket}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(245,158,11,0.1)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxRating) * 100}%`,
                      background: "linear-gradient(90deg, #f59e0b, #f97316)",
                      minWidth: count > 0 ? 8 : 0,
                    }} />
                </div>
                <span className="text-xs font-bold text-slate-400 w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Position distribution */}
        <div className="hub-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={15} style={{ color: "#a78bfa" }} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posities</span>
          </div>
          <div className="space-y-2.5">
            {positionRanked.slice(0, 8).map(([pos, count]) => (
              <div key={pos} className="flex items-center gap-3">
                <span className="text-xs font-bold w-10 text-slate-600">{pos}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(167,139,250,0.1)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(count / maxPos) * 100}%`,
                      background: "linear-gradient(90deg, #a78bfa, #7c3aed)",
                      minWidth: 8,
                    }} />
                </div>
                <span className="text-xs text-slate-400 w-24 truncate">{POSITION_LABELS[pos]}</span>
                <span className="text-xs font-bold text-slate-500 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan agreements */}
        <div className="hub-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={15} style={{ color: "#10b981" }} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Persoonlijke plannen</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="text-4xl font-black" style={{ fontFamily: "Oswald, sans-serif", color: "#10b981" }}>
              {completionRate}%
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700">Afrondingspercentage</div>
              <div className="text-xs text-slate-400">{agreementTotal} afspraken totaal</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Open", value: agreementStatus.open, color: "#94a3b8" },
              { label: "Bezig", value: agreementStatus.in_progress, color: "#4FA9E6" },
              { label: "Voltooid", value: agreementStatus.completed, color: "#10b981" },
              { label: "Gemist", value: agreementStatus.missed, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-slate-500 flex-1">{s.label}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: `${s.color}18` }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: agreementTotal ? `${(s.value / agreementTotal) * 100}%` : "0%",
                      background: s.color,
                      minWidth: s.value > 0 ? 6 : 0,
                    }} />
                </div>
                <span className="text-xs font-bold text-slate-500 w-6 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
