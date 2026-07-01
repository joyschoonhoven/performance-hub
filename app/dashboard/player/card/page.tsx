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
    <div style={{minHeight:"calc(100dvh - 56px)",display:"flex",alignItems:"center",justifyContent:"center",background:"#071426",margin:"-16px -12px"}}>
      <Loader2 size={26} className="animate-spin" style={{color:"#4DAEE5"}}/>
    </div>
  );

  if (!player) return (
    <div style={{minHeight:"calc(100dvh - 56px)",display:"flex",alignItems:"center",justifyContent:"center",background:"#071426",margin:"-16px -12px",color:"#EAF2FB"}}>
      <div style={{textAlign:"center"}}>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Geen spelerskaart</h2>
        <p style={{fontSize:13,color:"#8FA8C6",marginBottom:20}}>Vul je profiel in om je kaart te maken.</p>
        <Link href="/onboarding" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:10,background:"linear-gradient(135deg,#4DAEE5,#1B6CA8)",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none"}}>
          Profiel aanvullen <ChevronRight size={13}/>
        </Link>
      </div>
    </div>
  );

  return <PlayerCardView player={player}/>;
}
