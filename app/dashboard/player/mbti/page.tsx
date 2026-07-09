"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, RotateCcw, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { SFA, PREMIUM_CSS, PremiumHeader, Reveal } from "@/components/ui/premium";
import {
  MBTI_QUESTIONS, MBTI_PROFILES, scoreMbti, situationalCues, type MbtiCode,
} from "@/lib/mbti";
import type { PlayerWithDetails } from "@/lib/types";

export default function MbtiPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, "a" | "b">>({});
  const [result, setResult] = useState<MbtiCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyPlayerData();
        setPlayer(p);
        const existing = p?.mbti_type;
        if (existing && existing in MBTI_PROFILES) setResult(existing as MbtiCode);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const answered = Object.keys(answers).length;
  const total = MBTI_QUESTIONS.length;
  const complete = answered === total;

  async function finish() {
    setSaving(true);
    const { code } = scoreMbti(answers);
    if (player?.id) {
      try { await createClient().from("players").update({ mbti_type: code }).eq("id", player.id); } catch {}
    }
    setResult(code);
    setRetaking(false);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS }} />
      <div className="pv-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: SFA.blue }} />
      </div>
    </>
  );

  const showResult = result && !retaking;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS + CSS }} />
      <div className="pv-root">
        <div className="pv-wrap" style={{ maxWidth: 760 }}>
          <PremiumHeader
            eyebrow="Persoonlijkheid"
            title="Speler-DNA · MBTI"
            subtitle={showResult ? "Jouw persoonlijkheidstype en hoe je speelt per situatie." : "Beantwoord 16 vragen — kies wat het meest bij jou past."}
            action={showResult ? (
              <button className="pv-btn" style={{ height: 40, background: "transparent", color: SFA.blue, border: `1px solid ${SFA.line}`, boxShadow: "none" }}
                onClick={() => { setRetaking(true); setAnswers({}); }}>
                <RotateCcw size={14} /> Opnieuw doen
              </button>
            ) : undefined}
          />

          {showResult ? (
            <MbtiResult code={result} />
          ) : (
            <>
              {/* progress */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: SFA.track, overflow: "hidden" }}>
                  <motion.div animate={{ width: `${(answered / total) * 100}%` }} transition={{ duration: 0.3 }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${SFA.sky}, ${SFA.blue})`, borderRadius: 999 }} />
                </div>
                <span className="pv-num" style={{ fontSize: 13, fontWeight: 700, color: SFA.sub }}>{answered}/{total}</span>
              </div>

              {MBTI_QUESTIONS.map((q, i) => (
                <Reveal key={q.id} i={i % 6}>
                  <div className="pv-card notch" style={{ padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: SFA.dim, textTransform: "uppercase", marginBottom: 12 }}>
                      Vraag {i + 1}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="mbti-choices">
                      {(["a", "b"] as const).map((opt) => {
                        const on = answers[q.id] === opt;
                        const o = q[opt];
                        return (
                          <button key={opt} onClick={() => setAnswers((s) => ({ ...s, [q.id]: opt }))}
                            style={{
                              textAlign: "left", padding: "13px 15px", borderRadius: 12, cursor: "pointer",
                              background: on ? `${SFA.blue}0E` : SFA.card,
                              border: `1.5px solid ${on ? SFA.blue : SFA.line}`,
                              color: SFA.ink, fontSize: 13.5, lineHeight: 1.45, transition: "all 0.15s",
                              display: "flex", gap: 9, alignItems: "flex-start",
                            }}>
                            <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                              border: `1.5px solid ${on ? SFA.blue : SFA.dim}`, background: on ? SFA.blue : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {on && <Check size={11} color="#fff" />}
                            </span>
                            {o.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Reveal>
              ))}

              <button onClick={finish} disabled={!complete || saving} className="pv-btn"
                style={{ opacity: (!complete || saving) ? 0.5 : 1, cursor: (!complete || saving) ? "default" : "pointer" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
                {complete ? "Bekijk mijn type" : `Nog ${total - answered} vragen`}
              </button>
            </>
          )}

          <Link href="/dashboard/player" style={{ fontSize: 12, fontWeight: 600, color: SFA.sub, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Naar dashboard <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </>
  );
}

/* ── Result: type + handelingen/valkuilen + situationele cues ── */
export function MbtiResult({ code }: { code: MbtiCode }) {
  const p = MBTI_PROFILES[code];
  const cues = situationalCues(code);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* type header */}
      <Reveal>
        <div className="pv-card notch" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${p.color}, ${p.color}80)` }} />
          <div style={{ padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, flexShrink: 0, background: `${p.color}16`, border: `1px solid ${p.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{p.icon}</div>
            <div>
              <div className="pv-num" style={{ fontSize: 26, fontWeight: 700, color: p.color, letterSpacing: "0.04em", lineHeight: 1 }}>{p.code}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: SFA.ink }}>{p.nickname}</div>
              <div style={{ fontSize: 12.5, color: SFA.sub, marginTop: 3, lineHeight: 1.45 }}>{p.summary}</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* strengths + pitfalls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="mbti-sp">
        <Reveal i={1}>
          <div className="pv-card notch" style={{ padding: 18, height: "100%" }}>
            <div className="pv-label" style={{ color: SFA.green, marginBottom: 12 }}>Kracht → handeling</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 13 }}>
              {p.strengths.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 8, lineHeight: 1.4 }}>
                  <span style={{ color: SFA.green, flexShrink: 0, marginTop: 1 }}>▲</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SFA.ink }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: SFA.sub, marginTop: 2 }}>→ {s.tip}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal i={2}>
          <div className="pv-card notch" style={{ padding: 18, height: "100%" }}>
            <div className="pv-label" style={{ color: SFA.red, marginBottom: 12 }}>Valkuil → handeling</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 13 }}>
              {p.pitfalls.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 8, lineHeight: 1.4 }}>
                  <span style={{ color: SFA.red, flexShrink: 0, marginTop: 1 }}>▼</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SFA.ink }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: SFA.sub, marginTop: 2 }}>→ {s.tip}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {/* situational cues */}
      <Reveal i={3}>
        <div className="pv-card notch" style={{ padding: 18 }}>
          <div className="pv-label" style={{ marginBottom: 14 }}>Per situatie op het veld</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cues.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 13px", borderRadius: 11, background: "#F7FAFC", border: `1px solid ${SFA.line}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                  <b style={{ color: SFA.blue }}>{c.situation}:</b> <span style={{ color: SFA.ink }}>{c.trait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

const CSS = `
  @media (max-width: 560px) {
    .mbti-choices { grid-template-columns: 1fr !important; }
    .mbti-sp { grid-template-columns: 1fr !important; }
  }
`;
