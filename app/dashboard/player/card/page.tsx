"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Star, ChevronRight } from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { ARCHETYPES, SOCIOTYPES, CATEGORY_LABELS } from "@/lib/types";
import { getRatingLabel } from "@/lib/utils";
import type { EvaluationCategory, PlayerWithDetails } from "@/lib/types";

/* ═══════════════════════════════════════════════
   SFA TOKENS
═══════════════════════════════════════════════ */
const T = {
  bg:      "#071426",
  panel:   "rgba(13,30,54,0.72)",
  line:    "rgba(120,175,225,0.14)",
  ink:     "#EAF2FB",
  sub:     "#8FA8C6",
  dim:     "#4E688A",
  blue:    "#1B6CA8",
  sky:     "#4DAEE5",
  gold:    "#F0A500",
  red:     "#D64045",
  green:   "#33C481",
} as const;

const ATTR_ORDER: EvaluationCategory[] = ["techniek","fysiek","tactiek","mentaal","teamplay"];

/* value colour (0-99) — SFA scaled */
function valColor(v: number): string {
  if (v >= 85) return T.sky;
  if (v >= 75) return T.green;
  if (v >= 65) return T.gold;
  if (v >= 50) return "#E08A3C";
  return T.red;
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function PlayerCardPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setPlayer(await getMyPlayerData()); }
      catch(e){ console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="fc-root" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Loader2 size={26} className="animate-spin" style={{color:T.sky}}/>
      </div>
    </>
  );

  if (!player) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="fc-root" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <h2 style={{fontSize:20,fontWeight:800,color:T.ink,marginBottom:8}}>Geen spelerskaart</h2>
          <p style={{fontSize:13,color:T.sub,marginBottom:20}}>Vul je profiel in om je kaart te maken.</p>
          <Link href="/onboarding" style={btn}>Profiel aanvullen <ChevronRight size={13}/></Link>
        </div>
      </div>
    </>
  );

  /* derived */
  const ovr    = player.overall_rating;
  const latest = player.evaluations?.[0];
  const attrs = ATTR_ORDER.map(cat => ({
    cat, label: CATEGORY_LABELS[cat],
    val: Math.round((latest?.scores?.find(s=>s.category===cat)?.score ?? 0) * 10),
  }));
  const photo = player.photo_url ?? player.avatar_url ?? null;
  const age = calcAge(player.date_of_birth);
  const foot = player.dominant_foot === "left" ? "L" : player.dominant_foot === "both" ? "L/R" : "R";
  const archetype = player.identity?.primary_archetype ? ARCHETYPES[player.identity.primary_archetype] : null;
  const sociotype = player.identity?.primary_sociotype ? SOCIOTYPES[player.identity.primary_sociotype] : null;
  const technique = latest?.scores?.find(s=>s.category==="techniek")?.score ?? 0;
  const skillMoves = Math.max(1, Math.min(5, Math.round(technique/2)));
  const posCount = 1 + (player.secondary_position?1:0);
  const evalCount = player.evaluations?.length ?? 0;
  const doneCh = player.challenges?.filter(c=>c.status==="completed").length ?? 0;
  const playstyles = [...(archetype?.traits ?? []), ...(sociotype?.traits ?? [])].slice(0,6);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="fc-root">
        <div className="fc-streak fc-streak-1"/>
        <div className="fc-streak fc-streak-2"/>

        <div className="fc-stage">
          {/* ══ PANEL ══ */}
          <div className="fc-panel">
            {/* header */}
            <div className="fc-head">
              <div>
                <div className="fc-ovrline">
                  <span className="fc-ovr" style={{color: valColor(ovr)}}>{ovr}</span>
                  <span className="fc-bar">|</span>
                  <span className="fc-pos">{player.position}</span>
                  {player.secondary_position && <span className="fc-pos fc-pos2">{player.secondary_position}</span>}
                </div>
                <div className="fc-first">{player.first_name}</div>
                <div className="fc-last">
                  <span className="fc-flag">{flag(player.nationality)}</span>
                  {player.last_name}
                </div>
              </div>
              <div className="fc-club">
                <div className="fc-club-badge">
                  <Image src="/logo.png" alt="" width={30} height={30} style={{objectFit:"contain"}}/>
                </div>
                <span className="fc-club-name">{clubAbbr(player.team_name || player.club)}</span>
              </div>
            </div>

            {/* meta line */}
            <div className="fc-meta">
              <span>Leeftijd: <b>{age ?? "—"}</b></span>
              <span className="fc-dot">|</span>
              <span>Lengte <b>{player.height_cm?`${player.height_cm} cm`:"—"}</b></span>
              <span className="fc-dot">|</span>
              <span>Voet <b>{foot}</b></span>
            </div>

            {/* SUMMARY */}
            <div className="fc-section-label">Samenvatting</div>
            <div className="fc-summary">
              {/* left attributes */}
              <div className="fc-attrs">
                {attrs.map(a=>(
                  <div className="fc-attr" key={a.cat}>
                    <span className="fc-attr-k">{a.label}</span>
                    <span className="fc-attr-v" style={{color: a.val>0?valColor(a.val):T.dim}}>
                      {a.val>0?a.val:"–"}
                    </span>
                  </div>
                ))}
              </div>

              {/* right meta */}
              <div className="fc-rmeta">
                <div className="fc-rrow">
                  <span className="fc-attr-k">Posities</span>
                  <span className="fc-rval">{posCount}</span>
                </div>
                <div className="fc-rrow">
                  <span className="fc-attr-k">Skill Moves</span>
                  <Stars n={skillMoves}/>
                </div>
                {archetype && (
                  <div className="fc-rrow">
                    <span className="fc-attr-k">Archetype</span>
                    <span className="fc-rtag" style={{color:archetype.color}}>
                      <span>{archetype.icon}</span>{archetype.label}
                    </span>
                  </div>
                )}
                {sociotype && (
                  <div className="fc-rrow">
                    <span className="fc-attr-k">Sociotype</span>
                    <span className="fc-rtag" style={{color:sociotype.color_hex}}>
                      <span>{sociotype.icon}</span>{sociotype.label}
                    </span>
                  </div>
                )}
                {playstyles.length>0 && (
                  <div className="fc-rrow fc-rrow-ps">
                    <span className="fc-attr-k">PlayStyles</span>
                    <div className="fc-ps">
                      {playstyles.map((p,i)=>(
                        <span className="fc-diamond" key={i} title={p}>
                          <span>{p[0]?.toUpperCase()}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DEVELOPMENT */}
            <div className="fc-divider"/>
            <div className="fc-section-label">Ontwikkeling</div>
            <div className="fc-fin">
              <div className="fc-finrow"><span>Status</span><b style={{color:valColor(ovr)}}>{getRatingLabel(ovr)}</b></div>
              <div className="fc-finrow"><span>Evaluaties</span><b>{evalCount}</b></div>
              <div className="fc-finrow"><span>Challenges voltooid</span><b>{doneCh}</b></div>
            </div>

            {/* dots */}
            <div className="fc-dots">
              {[0,1,2,3,4,5].map(i=><span key={i} className={i===0?"on":""}/>)}
            </div>
          </div>

          {/* ══ RENDER ══ */}
          <div className="fc-render">
            {photo ? (
              <div className="fc-photo">
                <Image src={photo} alt="" fill unoptimized
                  style={{objectFit:"cover",objectPosition:"top center"}}/>
                <div className="fc-photo-fade"/>
              </div>
            ) : (
              <div className="fc-nophoto">
                <span className="fc-nophoto-num">{player.jersey_number ?? player.position}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   BITS
═══════════════════════════════════════════════ */
function Stars({ n }: { n:number }) {
  return (
    <span style={{display:"inline-flex",gap:1}}>
      {[1,2,3,4,5].map(i=>(
        <Star key={i} size={13}
          style={{color: i<=n ? T.gold : "rgba(143,168,198,0.3)"}}
          fill={i<=n ? T.gold : "transparent"} strokeWidth={1.5}/>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob); if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear()-d.getFullYear();
  const m = now.getMonth()-d.getMonth();
  if (m<0 || (m===0 && now.getDate()<d.getDate())) a--;
  return a;
}
function clubAbbr(name?: string): string {
  if (!name) return "SFA";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0,3).toUpperCase();
  return words.map(w=>w[0]).join("").slice(0,3).toUpperCase();
}
function flag(nat?: string): string {
  const m: Record<string,string> = {
    nederland:"🇳🇱",netherlands:"🇳🇱",nl:"🇳🇱",dutch:"🇳🇱",
    belgië:"🇧🇪",belgium:"🇧🇪",be:"🇧🇪",duitsland:"🇩🇪",germany:"🇩🇪",
    frankrijk:"🇫🇷",france:"🇫🇷",spanje:"🇪🇸",spain:"🇪🇸",portugal:"🇵🇹",
    italië:"🇮🇹",italy:"🇮🇹",brazilië:"🇧🇷",brazil:"🇧🇷",marokko:"🇲🇦",
    morocco:"🇲🇦",turkije:"🇹🇷",turkey:"🇹🇷",suriname:"🇸🇷",
  };
  return m[(nat??"").toLowerCase().trim()] ?? "🏳️";
}

const btn: React.CSSProperties = {
  display:"inline-flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:10,
  background:`linear-gradient(135deg,${T.sky},${T.blue})`,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",
};

/* ═══════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@600;700&display=swap');

  .fc-root {
    position:relative; overflow:hidden;
    font-family:'Archivo',system-ui,sans-serif;
    color:${T.ink};
    min-height: calc(100dvh - 56px);
    margin:-16px -12px -16px;
    padding:0;
    background:
      radial-gradient(ellipse 90% 60% at 78% 40%, rgba(27,108,168,0.22), transparent 60%),
      linear-gradient(120deg, #050F1D 0%, ${T.bg} 45%, #0A1E3A 100%);
  }
  @media (min-width:1024px){ .fc-root{ margin:-28px -28px -40px; } }
  @media (min-width:641px) and (max-width:1023px){ .fc-root{ margin:-16px -20px -16px; } }

  .fc-streak { position:absolute; top:-20%; height:150%; width:34%;
    transform:skewX(-14deg); pointer-events:none; }
  .fc-streak-1 { left:52%; background:linear-gradient(90deg, transparent, rgba(120,175,225,0.05), transparent); }
  .fc-streak-2 { left:70%; background:linear-gradient(90deg, transparent, rgba(120,175,225,0.07), transparent); }

  .fc-stage {
    position:relative; z-index:1;
    display:flex; align-items:stretch; justify-content:center;
    min-height: calc(100dvh - 56px);
    max-width:1100px; margin:0 auto;
  }

  .fc-panel {
    position:relative; z-index:2;
    width:min(540px, 92vw);
    align-self:center;
    margin:28px 0 28px 24px;
    padding:26px 28px;
    background:${T.panel};
    border:1px solid ${T.line};
    border-radius:16px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 30px 80px -30px rgba(0,0,0,0.7);
  }

  .fc-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
  .fc-ovrline { display:flex; align-items:center; gap:9px; }
  .fc-ovr { font-family:'Archivo Narrow',sans-serif; font-size:30px; font-weight:700; line-height:1; }
  .fc-bar { color:${T.dim}; font-weight:300; font-size:22px; }
  .fc-pos { font-size:15px; font-weight:700; color:${T.ink}; letter-spacing:0.02em; }
  .fc-pos2 { color:${T.sub}; }
  .fc-first { font-size:15px; color:${T.sub}; font-weight:500; margin-top:10px; line-height:1; }
  .fc-last { font-size:34px; font-weight:900; color:${T.ink}; letter-spacing:-0.02em; line-height:1.05; margin-top:2px;
    display:flex; align-items:center; gap:9px; }
  .fc-flag { font-size:22px; }

  .fc-club { display:flex; flex-direction:column; align-items:center; gap:5px; flex-shrink:0; }
  .fc-club-badge { width:46px; height:46px; border-radius:50%;
    background:rgba(255,255,255,0.06); border:1px solid ${T.line};
    display:flex; align-items:center; justify-content:center; }
  .fc-club-name { font-size:11px; font-weight:700; letter-spacing:0.1em; color:${T.sub}; }

  .fc-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    margin-top:16px; padding-bottom:16px; border-bottom:1px solid ${T.line};
    font-size:13px; color:${T.sub}; }
  .fc-meta b { color:${T.ink}; font-weight:700; }
  .fc-dot { color:${T.dim}; }

  .fc-section-label { font-size:13px; font-weight:700; color:${T.sub}; margin:18px 0 12px; }

  .fc-summary { display:grid; grid-template-columns:1fr 1fr; gap:8px 28px; }
  .fc-attrs, .fc-rmeta { display:flex; flex-direction:column; gap:11px; }

  .fc-attr, .fc-rrow { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .fc-attr-k { font-size:14px; color:${T.sub}; font-weight:500; }
  .fc-attr-v { font-family:'Archivo Narrow',sans-serif; font-size:19px; font-weight:700; }
  .fc-rval { font-family:'Archivo Narrow',sans-serif; font-size:17px; font-weight:700; color:${T.ink}; }
  .fc-rtag { display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:700; text-align:right; max-width:130px; }
  .fc-rrow-ps { align-items:flex-start; }
  .fc-ps { display:flex; flex-wrap:wrap; gap:7px; justify-content:flex-end; max-width:150px; }
  .fc-diamond { width:24px; height:24px; transform:rotate(45deg); border-radius:5px;
    background:linear-gradient(135deg, rgba(77,174,229,0.22), rgba(27,108,168,0.28));
    border:1px solid ${T.line}; display:flex; align-items:center; justify-content:center; }
  .fc-diamond span { transform:rotate(-45deg); font-size:11px; font-weight:800; color:${T.sky}; }

  .fc-divider { height:1px; background:${T.line}; margin:20px 0 0; }

  .fc-fin { display:flex; flex-direction:column; gap:11px; }
  .fc-finrow { display:flex; align-items:center; justify-content:space-between; font-size:14px; color:${T.sub}; }
  .fc-finrow b { font-family:'Archivo Narrow',sans-serif; font-size:17px; color:${T.ink}; font-weight:700; }

  .fc-dots { display:flex; gap:7px; justify-content:center; margin-top:22px; }
  .fc-dots span { width:6px; height:6px; border-radius:50%; background:rgba(143,168,198,0.3); }
  .fc-dots span.on { background:${T.sky}; width:16px; border-radius:3px; }

  .fc-render { position:relative; flex:1; align-self:stretch; min-width:0;
    display:flex; align-items:flex-end; justify-content:center; }
  .fc-photo { position:absolute; right:0; bottom:0; top:6%; width:min(460px, 46vw); }
  .fc-photo-fade { position:absolute; inset:0;
    background:linear-gradient(180deg, transparent 72%, ${T.bg} 99%),
              linear-gradient(90deg, rgba(7,20,38,0.35), transparent 25%); }
  .fc-nophoto { align-self:center; }
  .fc-nophoto-num { font-family:'Archivo Narrow',sans-serif; font-size:180px; font-weight:700;
    color:rgba(120,175,225,0.08); letter-spacing:-0.04em; }

  @media (max-width: 860px) {
    .fc-stage { flex-direction:column; }
    .fc-panel { width:auto; margin:20px 16px; align-self:auto; order:2; }
    .fc-render { order:1; min-height:300px; align-self:stretch; }
    .fc-photo { position:relative; right:auto; top:auto; width:240px; height:300px; margin:0 auto; }
    .fc-photo-fade { display:none; }
    .fc-streak { display:none; }
  }
  @media (max-width: 480px) {
    .fc-summary { grid-template-columns:1fr; gap:16px; }
    .fc-ps { justify-content:flex-start; }
    .fc-rtag { max-width:none; }
  }
`;
