"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import { getMyPlayerData } from "@/lib/supabase/queries";
import { PlayerCardView } from "@/components/player/PlayerCardView";
import type { PlayerWithDetails } from "@/lib/types";

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
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Loader2 size={26} className="animate-spin" style={{color:"#5A90BA"}}/>
    </div>
  );

  if (!player) return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#1F2937"}}>
      <div style={{textAlign:"center"}}>
        <h2 className="display-font" style={{fontSize:22,fontWeight:600,marginBottom:8}}>Geen spelerskaart</h2>
        <p style={{fontSize:13,color:"#6B7280",marginBottom:20}}>Vul je profiel in om je kaart te maken.</p>
        <Link href="/onboarding" className="cut-btn display-font" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"12px 24px",background:"#5A90BA",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>
          Profiel aanvullen <ChevronRight size={13}/>
        </Link>
      </div>
    </div>
  );

  return <PlayerCardView player={player}/>;
}
