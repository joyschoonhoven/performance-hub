"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { AmbientField } from "@/components/ui/AmbientField";
import { SORENESS_LOCATION_LABELS } from "@/lib/types";
import type { PlayerWithDetails, DailyCheckin, SorenessLocation } from "@/lib/types";

/* ═══════════════════════════════════════════════
   SFA BRAND TOKENS — light
═══════════════════════════════════════════════ */
const S = {
  page:   "#F4F7FA",
  card:   "#FFFFFF",
  ink:    "#0D1B2A",
  sub:    "#5A6B80",
  dim:    "#9BAABB",
  line:   "rgba(13,27,42,0.09)",
  lineHi: "rgba(13,27,42,0.16)",
  blue:   "#1B6CA8",
  sky:    "#4DAEE5",
  good:   "#2E9E6B",
  warn:   "#C77A0A",
  track:  "rgba(13,27,42,0.10)",
} as const;

type MetricKey = "sleep_quality" | "perceived_recovery" | "energy_level" | "mood" | "motivation" | "soreness";
interface MetricDef { key: MetricKey; label: string; invert: boolean; }
const METRICS: MetricDef[] = [
  { key:"sleep_quality",      label:"Slaap",     invert:false },
  { key:"perceived_recovery", label:"Herstel",   invert:false },
  { key:"energy_level",       label:"Energie",   invert:false },
  { key:"mood",               label:"Stemming",  invert:false },
  { key:"motivation",         label:"Motivatie", invert:false },
  { key:"soreness",           label:"Spierpijn", invert:true  },
];
const RADAR_KEYS: MetricKey[] = ["sleep_quality","perceived_recovery","energy_level","mood","motivation","soreness"];
const RADAR_LABELS = ["Slaap","Herstel","Energie","Stemming","Motivatie","Spierpijn"];

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function PlayerDashboardPage() {
  const [player,   setPlayer]   = useState<PlayerWithDetails | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data:{ user } } = await sb.auth.getUser();
        if (user) {
          const { data: prof } = await sb.from("profiles").select("full_name").eq("id", user.id).single();
          setUserName(prof?.full_name ?? "");
        }
        const p = await getMyPlayerData();
        setPlayer(p);
        if (p?.id) {
          try {
            const { data: cs } = await sb.from("daily_checkins").select("*")
              .eq("player_id", p.id).order("checkin_date",{ascending:false}).limit(30);
            setCheckins((cs ?? []) as DailyCheckin[]);
          } catch {}
        }
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="sfa-root" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:340}}>
        <Loader2 size={26} className="animate-spin" style={{color:S.blue}}/>
      </div>
    </>
  );

  if (!player) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="sfa-root" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:340}}>
        <div style={{textAlign:"center",maxWidth:380}}>
          <h2 style={{fontSize:20,fontWeight:800,color:S.ink,marginBottom:8}}>
            Welkom{userName?`, ${userName.split(" ")[0]}`:""}
          </h2>
          <p style={{fontSize:13,color:S.sub,marginBottom:22}}>Vul je profiel in zodat je coach je kan evalueren.</p>
          <Link href="/onboarding" style={btnPrimary}>Profiel aanvullen <ChevronRight size={13}/></Link>
        </div>
      </div>
    </>
  );

  const chrono   = [...checkins].sort((a,b)=> new Date(a.checkin_date).getTime()-new Date(b.checkin_date).getTime());
  const latest   = checkins[0];
  const lastDate = latest ? new Date(latest.checkin_date) : null;
  const overallPct = computeOverallPct(chrono);
  const soreLoc = (checkins.find(c => (c.soreness_locations?.length ?? 0) > 0)?.soreness_locations ?? []) as SorenessLocation[];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div className="sfa-root">
        <AmbientField tint="#4DAEE5" tint2="#1B6CA8" twinkle="#2B8AC7" intensity={0.9} />

        <div className="sfa-layer">
          {/* ═══ HEADER ═══ */}
          <motion.header className="sfa-header"
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <div className="sfa-wordmark">
              <div className="sfa-mark-line"/>
              <div>
                <div className="sfa-mark-name">SCHOONHOVEN</div>
                <div className="sfa-mark-sub">FOOTBALL&nbsp;ACADEMY</div>
              </div>
            </div>
            <div className="sfa-header-meta">
              <span><b>Performance Hub</b> · Herstelrapport</span>
              <span className="sfa-sep">|</span>
              <span>Bijgewerkt {lastDate ? lastDate.toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"2-digit"}) : "—"}</span>
            </div>
          </motion.header>

          {/* ═══ PROFILE BAR ═══ */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16,1,0.3,1] }}>
            <ProfileBar player={player}/>
          </motion.div>

          {/* ═══ REPORT ═══ */}
          <main className="sfa-report">
            <motion.div className="sfa-report-head"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <h1><span className="beta">[BETA]</span> HERSTELRAPPORT</h1>
              <Link href="/dashboard/player/checkin" className="sfa-guide">Check-in invullen →</Link>
            </motion.div>
            <p className="sfa-report-sub">
              Dagelijks gemeten. Percentages tonen de afwijking t.o.v. de eigen normaalwaarden per metriek.
            </p>

            {checkins.length === 0 ? (
              <EmptyReport/>
            ) : (
              <motion.div className="sfa-grid"
                initial="hidden" animate="show"
                variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.28 } } }}>
                <Reveal><OverallCard pct={overallPct} chrono={chrono}/></Reveal>
                {METRICS.map((m) => (
                  <Reveal key={m.key}><MetricCard def={m} chrono={chrono} latest={latest}/></Reveal>
                ))}
                <Reveal><SorenessCard locations={soreLoc}/></Reveal>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

/* staggered fade-up wrapper */
function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16,1,0.3,1] } },
      }}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE BAR — horizontal
═══════════════════════════════════════════════ */
function ProfileBar({ player }: { player: PlayerWithDetails }) {
  const photo = player.photo_url ?? player.avatar_url ?? null;
  const initials = `${player.first_name?.[0]??""}${player.last_name?.[0]??""}`.toUpperCase();
  const age = calcAge(player.date_of_birth);
  const footLabel = player.dominant_foot === "left" ? "Links" : player.dominant_foot === "both" ? "Beide" : "Rechts";

  const stats: Array<[string,string]> = [
    ["Positie", `${player.position}${player.secondary_position?` · ${player.secondary_position}`:""}`],
    ["Leeftijd", age!=null?`${age} jr`:"—"],
    ["Lengte", player.height_cm?`${player.height_cm} cm`:"—"],
    ["Gewicht", player.weight_kg?`${player.weight_kg} kg`:"—"],
    ["Voet", footLabel],
    ["Nationaliteit", player.nationality || "—"],
    ["Rugnummer", player.jersey_number != null ? `#${player.jersey_number}` : "—"],
    ["Club", player.team_name || player.club || "—"],
  ];

  return (
    <div className="sfa-pbar">
      <div className="sfa-pbar-id">
        <div className="sfa-avatar">
          {photo ? <Image src={photo} alt="" fill unoptimized style={{objectFit:"cover",objectPosition:"top"}}/>
                 : <span>{initials}</span>}
        </div>
        <div style={{minWidth:0}}>
          <div className="sfa-name-first">{player.first_name}</div>
          <div className="sfa-name-last">{player.last_name}</div>
        </div>
      </div>
      <div className="sfa-pbar-stats">
        {stats.map(([k,v],i)=>(
          <div className="sfa-pstat" key={i}>
            <span className="sfa-pstat-k">{k}</span>
            <span className="sfa-pstat-v">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   OVERALL RECOVERY CARD
═══════════════════════════════════════════════ */
function OverallCard({ pct, chrono }: { pct: number; chrono: DailyCheckin[] }) {
  const good = pct >= 0;
  return (
    <div className="sfa-card notch sfa-card-hover sfa-card-glow">
      <div className="sfa-card-title">Algeheel herstel</div>
      <div className="sfa-card-note">Samengesteld uit alle metrieken</div>

      <div className="sfa-recent-row" style={{marginTop:12}}>
        <span className="sfa-recent-label">Meest recent</span>
        <span className="sfa-recent-val" style={{color: good?S.good:S.warn}}>{fmtPct(pct)}</span>
      </div>

      <RecoveryRadar chrono={chrono}/>
    </div>
  );
}

function RecoveryRadar({ chrono }: { chrono: DailyCheckin[] }) {
  const size=204, cx=size/2, cy=size/2+4, R=size*0.30, LR=R+22;
  const n = RADAR_KEYS.length;
  const ang=(i:number)=> (2*Math.PI*i/n) - Math.PI/2;
  const pt=(r:number,i:number)=>({x:cx+Math.cos(ang(i))*r, y:cy+Math.sin(ang(i))*r});

  const vals = RADAR_KEYS.map(k=>{
    const inv = k==="soreness";
    const arr = chrono.slice(-7).map(c=> c[k] as number|undefined).filter(v=>v!=null) as number[];
    if(!arr.length) return 0.05;
    const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
    return Math.max(inv ? (10-mean)/10 : mean/10, 0.05);
  });

  const rings=[0.34,0.67,1];
  const ringPath=(f:number)=> RADAR_KEYS.map((_,i)=>{const p=pt(R*f,i);return `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(" ")+"Z";
  const dataPts = vals.map((v,i)=>pt(R*v,i));
  const dataPath = dataPts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";

  return (
    <motion.svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}
      style={{overflow:"visible",display:"block",marginTop:10}}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
      <defs>
        <linearGradient id="rad-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={S.sky} stopOpacity="0.34"/>
          <stop offset="100%" stopColor={S.blue} stopOpacity="0.14"/>
        </linearGradient>
      </defs>
      {rings.map((f,ri)=><path key={ri} d={ringPath(f)} fill="none" stroke={S.line} strokeWidth={1} strokeDasharray={ri<2?"2 3":undefined}/>)}
      {RADAR_KEYS.map((_,i)=>{const p=pt(R,i);return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={S.line} strokeWidth={1}/>;})}
      <motion.path d={dataPath} fill="url(#rad-fill)" stroke={S.blue} strokeWidth={1.5}
        initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}}
        transition={{duration:0.8,delay:0.3,ease:[0.16,1,0.3,1]}} style={{transformOrigin:`${cx}px ${cy}px`}}/>
      {dataPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={2.6} fill={S.blue} stroke={S.card} strokeWidth={1.5}/>)}
      {RADAR_LABELS.map((lab,i)=>{
        const p=pt(LR,i);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          fontSize={8.5} fontWeight={700} fill={S.sub} style={{fontFamily:"var(--sans)",letterSpacing:"0.03em"}}>{lab}</text>;
      })}
    </motion.svg>
  );
}

/* ═══════════════════════════════════════════════
   METRIC CARD
═══════════════════════════════════════════════ */
function MetricCard({ def, chrono, latest }: {
  def: MetricDef; chrono: DailyCheckin[]; latest: DailyCheckin | undefined;
}) {
  const series = chrono.map(c => c[def.key] as number|undefined).filter(v=>v!=null) as number[];
  const recentVal = latest?.[def.key] as number|undefined;
  const baseline = series.length ? series.reduce((a,b)=>a+b,0)/series.length : 0;

  const last7  = series.slice(-7);
  const last30 = series.slice(-30);
  const avg7   = last7.length  ? last7.reduce((a,b)=>a+b,0)/last7.length   : null;
  const avg30  = last30.length ? last30.reduce((a,b)=>a+b,0)/last30.length : null;

  const dev = (x:number|null|undefined) => (baseline && x!=null) ? ((x-baseline)/baseline)*100 : 0;
  const recentPct = dev(recentVal);
  const isGood = (pct:number) => def.invert ? pct <= 0 : pct >= 0;
  const warn = recentVal!=null && (def.invert ? recentVal >= 6 : recentVal <= 4);

  return (
    <div className="sfa-card notch sfa-card-hover">
      <div className="sfa-card-title">
        {def.label}
        {warn && <span className="sfa-warn-dot" title="Onder normaalwaarde"/>}
      </div>

      <div className="sfa-recent-row">
        <span className="sfa-recent-label">Meest recent</span>
        <span className="sfa-recent-val" style={{color:isGood(recentPct)?S.good:S.warn}}>{fmtPct(recentPct)}</span>
      </div>

      <MiniBars series={series} baseline={baseline}/>

      <div className="sfa-avgs">
        <div className="sfa-avg">
          <span>7-daags gem.</span>
          <b style={{color:isGood(dev(avg7))?S.good:S.warn}}>{fmtPct(dev(avg7))}</b>
        </div>
        <div className="sfa-avg">
          <span>30-daags gem.</span>
          <b style={{color:isGood(dev(avg30))?S.good:S.warn}}>{fmtPct(dev(avg30))}</b>
        </div>
      </div>
    </div>
  );
}

function MiniBars({ series, baseline }: { series:number[]; baseline:number }) {
  const data = series.slice(-9);
  const W=230, H=60, PAD=2;
  const bw = data.length ? (W-2*PAD)/data.length : 0;
  const barW = Math.max(bw*0.6, 3);
  const gap = bw - barW;
  const mid = H*0.52;
  const scale = (H*0.4)/5;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block",margin:"6px 0 2px"}}>
      <line x1={0} y1={mid} x2={W} y2={mid} stroke={S.lineHi} strokeWidth={1} strokeDasharray="3 3"/>
      {data.map((v,i)=>{
        const dev = v - baseline;
        const h = Math.min(Math.abs(dev)*scale, H*0.42);
        const up = dev >= 0;
        const x = PAD + i*bw + gap/2;
        const y = up ? mid - h : mid;
        const isLast = i===data.length-1;
        return <rect key={i} x={x} y={y} width={barW} height={Math.max(h,2)} rx={1}
          fill={isLast ? S.blue : S.track}/>;
      })}
      <text x={2} y={mid-3} fontSize={8} fill={S.dim} style={{fontFamily:"var(--sans)"}}>gem.</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   SORENESS LOCATION
═══════════════════════════════════════════════ */
function SorenessCard({ locations }: { locations: SorenessLocation[] }) {
  const set = new Set(locations);
  const names = locations.map(l => SORENESS_LOCATION_LABELS[l]);
  return (
    <div className="sfa-card notch sfa-card-hover">
      <div className="sfa-card-title">Spierpijn locatie</div>
      <div className="sfa-card-note">Laatste melding</div>

      <div style={{display:"flex",justifyContent:"center",gap:8,margin:"12px 0 10px"}}>
        <BodySilhouette side="front" active={set}/>
        <BodySilhouette side="back" active={set}/>
      </div>

      {names.length ? (
        <div className="sfa-sore-cap">{names.join(" · ")}</div>
      ) : (
        <div className="sfa-sore-cap" style={{color:S.dim}}>Geen spierpijn gemeld</div>
      )}
    </div>
  );
}

function BodySilhouette({ side, active }: { side:"front"|"back"; active:Set<SorenessLocation> }) {
  const on = S.blue;
  const base = "rgba(13,27,42,0.05)";
  const stroke = "rgba(13,27,42,0.18)";
  const zone = (loc:SorenessLocation)=> active.has(loc) ? 0.9 : 0;
  return (
    <svg width="82" height="172" viewBox="0 0 86 176" style={{display:"block"}}>
      <g fill={base} stroke={stroke} strokeWidth={0.8}>
        <circle cx={43} cy={13} r={9}/>
        <rect x={38} y={21} width={10} height={7} rx={2}/>
        <path d="M25 28 Q43 24 61 28 L64 74 Q43 80 22 74 Z"/>
        <path d="M25 30 L14 38 L11 72 L18 74 L22 44 Z"/>
        <path d="M61 30 L72 38 L75 72 L68 74 L64 44 Z"/>
        <path d="M27 74 L40 74 L38 120 L30 120 Z"/>
        <path d="M46 74 L59 74 L56 120 L48 120 Z"/>
        <path d="M31 122 L38 122 L36 164 L32 164 Z"/>
        <path d="M48 122 L55 122 L54 164 L50 164 Z"/>
      </g>
      <g fill={on} strokeWidth={0}>
        {side==="front" ? (
          <>
            <ellipse cx={43} cy={13} rx={5} ry={5} opacity={zone("neck")}/>
            <rect x={30} y={30} width={26} height={9} rx={3} opacity={zone("shoulders")}/>
            <rect x={34} y={52} width={18} height={16} rx={4} opacity={zone("core")}/>
            <rect x={38} y={66} width={10} height={7} rx={3} opacity={zone("groin")}/>
            <rect x={28} y={80} width={11} height={30} rx={4} opacity={zone("quads")}/>
            <rect x={47} y={80} width={11} height={30} rx={4} opacity={zone("quads")}/>
            <rect x={30} y={116} width={9} height={7} rx={3} opacity={zone("knees")}/>
            <rect x={47} y={116} width={9} height={7} rx={3} opacity={zone("knees")}/>
            <rect x={31} y={158} width={8} height={8} rx={2} opacity={zone("feet")}/>
            <rect x={49} y={158} width={8} height={8} rx={2} opacity={zone("feet")}/>
          </>
        ) : (
          <>
            <rect x={32} y={30} width={22} height={12} rx={4} opacity={zone("upper_back")}/>
            <rect x={33} y={54} width={20} height={12} rx={4} opacity={zone("lower_back")}/>
            <rect x={28} y={80} width={11} height={30} rx={4} opacity={zone("hamstring")}/>
            <rect x={47} y={80} width={11} height={30} rx={4} opacity={zone("hamstring")}/>
            <rect x={31} y={124} width={9} height={26} rx={4} opacity={zone("calves")}/>
            <rect x={48} y={124} width={9} height={26} rx={4} opacity={zone("calves")}/>
            <rect x={31} y={152} width={8} height={9} rx={2} opacity={zone("ankles")}/>
            <rect x={49} y={152} width={8} height={9} rx={2} opacity={zone("ankles")}/>
          </>
        )}
      </g>
      <text x={43} y={174} textAnchor="middle" fontSize={7.5} fill={S.dim}
        style={{fontFamily:"var(--sans)",letterSpacing:"0.12em"}}>{side==="front"?"VOOR":"ACHTER"}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   EMPTY
═══════════════════════════════════════════════ */
function EmptyReport() {
  return (
    <div className="sfa-card notch" style={{gridColumn:"1 / -1",textAlign:"center",padding:"48px 24px"}}>
      <h3 style={{fontSize:16,fontWeight:800,color:S.ink,marginBottom:6}}>Nog geen check-in data</h3>
      <p style={{fontSize:13,color:S.sub,marginBottom:20}}>Vul je dagelijkse check-in in om je herstelrapport op te bouwen.</p>
      <Link href="/dashboard/player/checkin" style={btnPrimary}>Check-in invullen <ChevronRight size={13}/></Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob); if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
function fmtPct(p: number): string {
  const r = Math.round(p*10)/10;
  return `${r>0?"+":""}${r.toFixed(1)}%`;
}
function computeOverallPct(chrono: DailyCheckin[]): number {
  if (!chrono.length) return 0;
  const latest = chrono[chrono.length-1];
  const devs: number[] = [];
  for (const m of METRICS) {
    const series = chrono.map(c=>c[m.key] as number|undefined).filter(v=>v!=null) as number[];
    if (series.length < 2) continue;
    const base = series.reduce((a,b)=>a+b,0)/series.length;
    const v = latest[m.key] as number|undefined;
    if (base && v!=null) {
      const raw = ((v-base)/base)*100;
      devs.push(m.invert ? -raw : raw);
    }
  }
  return devs.length ? devs.reduce((a,b)=>a+b,0)/devs.length : 0;
}

const btnPrimary: React.CSSProperties = {
  display:"inline-flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:8,
  background:`linear-gradient(135deg, ${S.sky}, ${S.blue})`,color:"#fff",fontSize:13,fontWeight:700,
  textDecoration:"none",
};

/* ═══════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Archivo+Narrow:wght@600;700&display=swap');
  :root { --sans:'Archivo',system-ui,sans-serif; --num:'Archivo Narrow','Archivo',sans-serif; }

  .sfa-root {
    position: relative;
    overflow: hidden;
    font-family: var(--sans);
    background: ${S.page};
    color: ${S.ink};
    min-height: 100%;
    margin: -16px -12px -16px;
    padding: 0 0 90px;
  }
  .sfa-layer { position: relative; z-index: 1; }
  @media (min-width: 1024px) { .sfa-root { margin: -28px -28px -40px !important; } }
  @media (min-width: 641px) and (max-width: 1023px) { .sfa-root { margin: -16px -20px -16px !important; } }

  /* HEADER */
  .sfa-header {
    display:flex; align-items:center; justify-content:space-between; gap:16px;
    padding: 16px 26px; flex-wrap: wrap;
    background: ${S.card}; border-bottom: 1px solid ${S.line};
  }
  .sfa-wordmark { display:flex; align-items:center; gap:12px; }
  .sfa-mark-line { width:34px; height:4px; background:${S.blue}; border-radius:2px; }
  .sfa-mark-name { font-size:16px; font-weight:900; letter-spacing:0.14em; color:${S.ink}; line-height:1; }
  .sfa-mark-sub  { font-size:8.5px; font-weight:700; letter-spacing:0.42em; color:${S.blue}; margin-top:3px; }
  .sfa-header-meta { display:flex; align-items:center; gap:12px; font-size:12px; color:${S.sub}; flex-wrap:wrap; }
  .sfa-header-meta b { font-weight:800; color:${S.ink}; }
  .sfa-sep { color:${S.dim}; }

  /* PROFILE BAR */
  .sfa-pbar {
    display:flex; align-items:center; gap:22px; flex-wrap:wrap;
    margin: 22px 26px 0; padding:16px 20px;
    background:${S.card}; border:1px solid ${S.line}; border-radius:12px;
    box-shadow: 0 1px 2px rgba(13,27,42,0.04);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  }
  .sfa-pbar-id { display:flex; align-items:center; gap:13px; flex-shrink:0;
    padding-right:22px; border-right:1px solid ${S.line}; }
  .sfa-avatar {
    position:relative; width:52px; height:52px; border-radius:10px; overflow:hidden; flex-shrink:0;
    border:1px solid ${S.line}; background:${S.page};
    display:flex; align-items:center; justify-content:center;
    font-family:var(--num); font-size:19px; font-weight:700; color:${S.dim};
  }
  .sfa-name-first { font-size:12px; color:${S.sub}; font-weight:600; line-height:1.1; }
  .sfa-name-last  { font-size:19px; color:${S.ink}; font-weight:900; letter-spacing:-0.02em; line-height:1.1;
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }

  .sfa-pbar-stats { display:flex; align-items:center; gap:26px; flex-wrap:wrap; flex:1; }
  .sfa-pstat { display:flex; flex-direction:column; gap:3px; }
  .sfa-pstat-k { font-size:9.5px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:${S.dim}; }
  .sfa-pstat-v { font-size:14px; font-weight:700; color:${S.ink}; }

  /* REPORT */
  .sfa-report { padding: 24px 26px 0; }
  .sfa-report-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .sfa-report-head h1 { font-size:20px; font-weight:900; letter-spacing:0.02em; color:${S.ink}; }
  .sfa-report-head h1 .beta { color:${S.blue}; }
  .sfa-guide { font-size:12px; color:${S.blue}; text-decoration:none; font-weight:700; white-space:nowrap; }
  .sfa-guide:hover { text-decoration:underline; }
  .sfa-report-sub { font-size:12.5px; color:${S.sub}; margin:6px 0 20px; max-width:660px; }

  .sfa-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; }

  /* CARD */
  .sfa-card {
    background:${S.card}; border:1px solid ${S.line}; border-radius:12px;
    padding:18px 18px 20px; box-shadow: 0 1px 2px rgba(13,27,42,0.04);
  }
  .sfa-card.notch { clip-path: polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%); }
  .sfa-card-hover { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease; will-change: transform; }
  .sfa-card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(27,108,168,0.14); }
  .sfa-card-glow { position: relative; }
  .sfa-card-glow::before {
    content: ""; position: absolute; inset: -1px; border-radius: 12px; pointer-events: none;
    background: radial-gradient(120% 80% at 50% 0%, rgba(77,174,229,0.10), transparent 60%);
    opacity: 0; transition: opacity 0.4s ease;
  }
  .sfa-card-glow:hover::before { opacity: 1; }
  @media (prefers-reduced-motion: reduce) {
    .sfa-card-hover, .sfa-card-hover:hover { transition: none; transform: none; }
  }
  .sfa-card-title { font-size:16px; font-weight:800; color:${S.ink}; letter-spacing:-0.01em;
    display:flex; align-items:center; gap:7px; }
  .sfa-card-note { font-size:11px; color:${S.dim}; margin-top:2px; }
  .sfa-warn-dot { width:7px; height:7px; border-radius:50%; background:${S.warn}; display:inline-block; }

  .sfa-recent-row { display:flex; align-items:baseline; justify-content:space-between; margin:16px 0 4px; }
  .sfa-recent-label { font-size:13px; color:${S.sub}; }
  .sfa-recent-val { font-family:var(--num); font-size:22px; font-weight:700; letter-spacing:0.01em; }

  .sfa-avgs { margin-top:12px; display:flex; flex-direction:column; gap:9px; }
  .sfa-avg { display:flex; align-items:center; justify-content:space-between; }
  .sfa-avg span { font-size:12.5px; color:${S.sub}; }
  .sfa-avg b { font-family:var(--num); font-size:16px; font-weight:700; }

  .sfa-sore-cap { font-size:11.5px; color:${S.blue}; font-weight:700; text-align:center; line-height:1.5; }

  /* RESPONSIVE */
  @media (max-width: 1120px) { .sfa-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 900px) {
    .sfa-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .sfa-header, .sfa-pbar, .sfa-report { margin-left:14px; margin-right:14px; padding-left:14px; padding-right:14px; }
    .sfa-header { margin-left:0; margin-right:0; }
    .sfa-grid { grid-template-columns: 1fr; }
    .sfa-header-meta { font-size:11px; gap:8px; }
    .sfa-pbar-id { border-right:none; padding-right:0; }
    .sfa-pbar-stats { gap:16px; }
  }
`;
