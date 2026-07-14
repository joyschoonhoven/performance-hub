"use client";

// ============================================================
//  SCHOONHOVEN COMMUNITY — leaderboard, uitgelichte speler
//  ("speler van de week") en een activiteitenfeed met behaalde
//  challenges, evaluaties en tips. Voedt zich uit getAllPlayers().
// ============================================================

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Flame, TrendingUp, Award, Sparkles, ChevronRight, Medal } from "lucide-react";
import { getAllPlayers } from "@/lib/supabase/queries";
import { MBTI_PROFILES, type MbtiCode } from "@/lib/mbti";
import { MbtiShield } from "@/components/ui/ShieldBadge";
import { CATEGORY_LABELS } from "@/lib/types";
import type { PlayerWithDetails, EvaluationCategory } from "@/lib/types";

const S = {
  card: "#FFFFFF", ink: "#0D1B2A", sub: "#5A6B80", dim: "#9BAABB",
  line: "rgba(13,27,42,0.09)", page: "#F4F7FA",
  blue: "#5A90BA", navy: "#0D1B2A", gold: "#C9A227", good: "#2E9E6B", red: "#B4534A",
} as const;

type Metric = "rating" | "challenges" | "vorm";

interface FeedItem {
  id: string;
  kind: "challenge" | "evaluation" | "mbti" | "tip";
  name: string;
  avatar?: string | null;
  mbti?: string | null;
  text: string;
  when: number;         // timestamp voor sortering (0 = geen datum)
  emblem: React.ReactNode;
  accent: string;
}

const TIPS: { text: string; }[] = [
  { text: "Tip van de staf: rond je dag af met 10 minuten mobiliteit — je herstel gaat merkbaar omhoog." },
  { text: "Tip: vul je check-in elke ochtend in. Consistente data helpt je coach je belasting te sturen." },
  { text: "Wist je dat? Spelers die hun persoonlijkheidstest doen krijgen gerichtere speeltips per situatie." },
  { text: "Focus van de week: eerste balcontact. Neem de bal aan in de richting waar je naartoe wilt." },
];

function timeAgo(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "vandaag";
  if (d === 1) return "gisteren";
  if (d < 7) return `${d} dagen geleden`;
  if (d < 30) return `${Math.floor(d / 7)} wk geleden`;
  return `${Math.floor(d / 30)} mnd geleden`;
}

function initials(p: PlayerWithDetails) {
  return `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
}

function Avatar({ p, size = 34 }: { p: { avatar_url?: string | null; photo_url?: string | null; first_name: string; last_name?: string }; size?: number }) {
  const src = p.photo_url ?? p.avatar_url ?? null;
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0,
      background: S.page, border: `1px solid ${S.line}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: S.blue,
      fontFamily: "'Oswald','Archivo Narrow',sans-serif",
    }}>
      {src ? <Image src={src} alt="" width={size} height={size} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        : `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()}
    </div>
  );
}

export function CommunityBoard({ currentPlayerId }: { currentPlayerId: string }) {
  const [players, setPlayers] = useState<PlayerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("rating");

  useEffect(() => {
    getAllPlayers().then((data) => { setPlayers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const completedCount = (p: PlayerWithDetails) => p.challenges?.filter((c) => c.status === "completed").length ?? 0;
  const latestForm = (p: PlayerWithDetails) => {
    const evs = (p.evaluations ?? []).filter((e) => e.overall_score != null);
    return evs.length ? (evs[0].overall_score as number) : 0;
  };

  const ranked = useMemo(() => {
    const arr = [...players];
    if (metric === "rating") arr.sort((a, b) => b.overall_rating - a.overall_rating);
    else if (metric === "challenges") arr.sort((a, b) => completedCount(b) - completedCount(a));
    else arr.sort((a, b) => latestForm(b) - latestForm(a));
    return arr;
  }, [players, metric]);

  // Uitgelichte speler: hoogste rating (en niet zonder evaluatie als het kan)
  const featured = useMemo(() => {
    if (!players.length) return null;
    return [...players].sort((a, b) => b.overall_rating - a.overall_rating)[0];
  }, [players]);

  // Community-feed opbouwen uit echte data
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const p of players) {
      const name = `${p.first_name} ${p.last_name ?? ""}`.trim();
      // Behaalde challenges
      for (const c of p.challenges ?? []) {
        if (c.status !== "completed") continue;
        const cat = c.category as EvaluationCategory | undefined;
        items.push({
          id: `c-${c.id}`, kind: "challenge", name, avatar: p.photo_url ?? p.avatar_url, mbti: p.mbti_type,
          text: `voltooide de challenge "${c.title}"${cat ? ` · ${CATEGORY_LABELS[cat]}` : ""}`,
          when: new Date(c.updated_at ?? c.created_at ?? 0).getTime(),
          emblem: <Trophy size={13} />, accent: S.gold,
        });
      }
      // Nieuwe evaluatie
      const latestEval = (p.evaluations ?? [])[0];
      if (latestEval?.overall_score != null) {
        items.push({
          id: `e-${latestEval.id}`, kind: "evaluation", name, avatar: p.photo_url ?? p.avatar_url, mbti: p.mbti_type,
          text: `kreeg een nieuwe evaluatie: ${(latestEval.overall_score as number).toFixed(1)}`,
          when: new Date(latestEval.evaluation_date ?? 0).getTime(),
          emblem: <Award size={13} />, accent: S.blue,
        });
      }
      // Persoonlijkheidstype ontdekt
      if (p.mbti_type && p.mbti_type in MBTI_PROFILES) {
        items.push({
          id: `m-${p.id}`, kind: "mbti", name, avatar: p.photo_url ?? p.avatar_url, mbti: p.mbti_type,
          text: `ontdekte het speler-type ${MBTI_PROFILES[p.mbti_type as MbtiCode].nickname}`,
          when: 0, emblem: <Sparkles size={13} />, accent: "#7C5CD6",
        });
      }
    }
    items.sort((a, b) => b.when - a.when);

    // Tips ertussen strooien
    const out: FeedItem[] = [];
    let ti = 0;
    items.slice(0, 14).forEach((it, idx) => {
      out.push(it);
      if ((idx + 1) % 4 === 0 && ti < TIPS.length) {
        out.push({ id: `t-${ti}`, kind: "tip", name: "Schoonhoven Football Academy", text: TIPS[ti].text, when: 0, emblem: <Flame size={13} />, accent: S.good });
        ti++;
      }
    });
    if (!items.length && TIPS.length) {
      out.push({ id: "t-0", kind: "tip", name: "Schoonhoven Football Academy", text: TIPS[0].text, when: 0, emblem: <Flame size={13} />, accent: S.good });
    }
    return out;
  }, [players]);

  const metricValue = (p: PlayerWithDetails) =>
    metric === "rating" ? p.overall_rating
      : metric === "challenges" ? completedCount(p)
      : latestForm(p) ? latestForm(p).toFixed(1) : "—";

  if (loading) return null;
  if (players.length === 0) return null;

  const rankColor = (i: number) => i === 0 ? S.gold : i === 1 ? "#9AA7B4" : i === 2 ? "#C08A57" : S.dim;

  return (
    <section style={{ padding: "24px 26px 0" }} className="comm-wrap-outer">
      {/* Kop */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <h1 className="display-font" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.02em", color: S.ink }}>
          SCHOONHOVEN COMMUNITY
        </h1>
      </div>
      <p style={{ fontSize: 12.5, color: S.sub, margin: "6px 0 20px", maxWidth: 660 }}>
        Klassement van de academie en alles wat je teamgenoten behalen — challenges, evaluaties en tips van de staf.
      </p>

      <div className="comm-grid">
        {/* ── Links: uitgelichte speler + feed ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {featured && <FeaturedPlayer p={featured} isMe={featured.id === currentPlayerId} />}

          <div style={{ background: S.card, border: `1px solid ${S.line}`, borderRadius: 12, overflow: "hidden" }}>
            <div className="club-h" style={{ fontSize: 13, color: S.ink, padding: "14px 18px", borderBottom: `1px solid ${S.line}` }}>
              Community-kanaal
            </div>
            <div>
              {feed.map((it) => (
                <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 18px", borderBottom: `1px solid ${S.line}` }}>
                  {it.kind === "tip" ? (
                    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `${it.accent}14`, border: `1px solid ${it.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: it.accent }}>
                      {it.emblem}
                    </div>
                  ) : (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar p={{ avatar_url: it.avatar, first_name: it.name.split(" ")[0], last_name: it.name.split(" ")[1] }} size={34} />
                      <span style={{
                        position: "absolute", right: -4, bottom: -4, width: 17, height: 17, borderRadius: "50%",
                        background: it.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        border: `2px solid ${S.card}`,
                      }}>
                        {it.emblem}
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
                    <div style={{ fontSize: 12.5, color: S.ink }}>
                      <b style={{ fontWeight: 700 }}>{it.name}</b>{" "}
                      <span style={{ color: it.kind === "tip" ? S.sub : S.sub }}>{it.text}</span>
                    </div>
                    {it.when > 0 && <div style={{ fontSize: 10.5, color: S.dim, marginTop: 2 }}>{timeAgo(it.when)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rechts: leaderboard ── */}
        <div style={{ background: S.card, border: `1px solid ${S.line}`, borderRadius: 12, overflow: "hidden", alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", borderBottom: `1px solid ${S.line}` }}>
            <span className="club-h" style={{ fontSize: 13, color: S.ink }}>Klassement</span>
            <Medal size={15} style={{ color: S.gold }} />
          </div>

          {/* Metric-tabs */}
          <div style={{ display: "flex", gap: 4, padding: "10px 12px 4px" }}>
            {([["rating", "Rating"], ["challenges", "Challenges"], ["vorm", "Vorm"]] as [Metric, string][]).map(([m, lab]) => (
              <button key={m} onClick={() => setMetric(m)} className="cut-sm display-font" style={{
                flex: 1, height: 28, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                background: metric === m ? S.blue : S.page,
                border: `1px solid ${metric === m ? S.blue : S.line}`,
                color: metric === m ? "#fff" : S.sub,
              }}>
                {lab}
              </button>
            ))}
          </div>

          {/* Rijen */}
          <div style={{ padding: "8px 8px 10px" }}>
            {ranked.slice(0, 10).map((p, i) => {
              const isMe = p.id === currentPlayerId;
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                  background: isMe ? `${S.blue}12` : "transparent",
                  boxShadow: isMe ? `inset 0 0 0 1.5px ${S.blue}55` : "none",
                }}>
                  <span className="display-font" style={{ width: 20, textAlign: "center", fontSize: 15, fontWeight: 600, color: rankColor(i) }}>
                    {i + 1}
                  </span>
                  <Avatar p={p} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isMe ? 800 : 600, color: S.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.first_name} {p.last_name}{isMe && <span style={{ color: S.blue, fontWeight: 700 }}> · jij</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: S.dim }}>{p.position}</div>
                  </div>
                  {p.mbti_type && <MbtiShield code={p.mbti_type} size={18} />}
                  <span className="display-font" style={{ fontSize: 16, fontWeight: 600, color: S.ink, minWidth: 26, textAlign: "right", fontFeatureSettings: '"tnum" 1' }}>
                    {metricValue(p)}
                  </span>
                </div>
              );
            })}
          </div>

          <Link href="/dashboard/player/challenges" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "12px", borderTop: `1px solid ${S.line}`, fontSize: 12, fontWeight: 700,
            color: S.blue, textDecoration: "none",
          }}>
            Verdien badges & klim <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .comm-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; align-items: start; }
        @media (max-width: 900px) { .comm-grid { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .comm-wrap-outer { padding-left: 14px !important; padding-right: 14px !important; } }
      ` }} />
    </section>
  );
}

/* ── Uitgelichte speler ("speler van de week") ── */
function FeaturedPlayer({ p, isMe }: { p: PlayerWithDetails; isMe: boolean }) {
  const mbti = p.mbti_type && p.mbti_type in MBTI_PROFILES ? MBTI_PROFILES[p.mbti_type as MbtiCode] : null;
  const bestCat = p.recent_scores
    ? (Object.entries(p.recent_scores) as [EvaluationCategory, number][]).sort((a, b) => b[1] - a[1])[0]
    : null;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${S.navy} 0%, #14263A 100%)`,
      border: `1px solid rgba(90,144,186,0.35)`, borderRadius: 14, padding: 20,
      position: "relative", overflow: "hidden",
    }}>
      {/* accentvlak */}
      <div style={{ position: "absolute", top: 0, right: -40, width: 160, height: "100%", background: "rgba(90,144,186,0.12)", transform: "skewX(-12deg)", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 76, height: 76, borderRadius: 12, overflow: "hidden", flexShrink: 0,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Oswald',sans-serif", fontSize: 26, fontWeight: 600, color: "#fff",
        }}>
          {(p.photo_url ?? p.avatar_url)
            ? <Image src={(p.photo_url ?? p.avatar_url)!} alt="" width={76} height={76} unoptimized style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display-font" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", color: "#7FB0D6" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><TrendingUp size={12} /> SPELER VAN DE WEEK</span>
          </div>
          <div className="display-font" style={{ fontSize: 24, fontWeight: 600, color: "#fff", textTransform: "uppercase", lineHeight: 1.1, marginTop: 4 }}>
            {p.first_name} {p.last_name}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
            {p.position}{mbti ? ` · ${mbti.nickname}` : ""}{isMe ? " · dat ben jij!" : ""}
          </div>
        </div>
        {mbti && <div style={{ flexShrink: 0 }}><MbtiShield code={mbti.code} size={48} /></div>}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="display-font" style={{ fontSize: 44, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{p.overall_rating}</div>
          <div className="display-font" style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>RATING</div>
        </div>
      </div>
      {bestCat && bestCat[1] > 0 && (
        <div style={{ position: "relative", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Uitblinker in <b style={{ color: "#fff" }}>{CATEGORY_LABELS[bestCat[0]]}</b> met een {bestCat[1].toFixed(1)} in de laatste evaluatie.
        </div>
      )}
    </div>
  );
}
