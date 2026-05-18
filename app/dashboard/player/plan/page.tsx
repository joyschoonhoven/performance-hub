"use client";

import { useEffect, useState } from "react";
import { Loader2, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyPlayerData } from "@/lib/supabase/queries";
import type { PlayerWithDetails } from "@/lib/types";
import { PlanView } from "@/components/plan/PlanView";

export default function PlayerPlanPage() {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [name, setName] = useState<string>("Speler");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
          if (!cancelled && data?.full_name) setName(data.full_name);
        }
      } catch { /* demo mode */ }

      const p = await getMyPlayerData();
      if (!cancelled) {
        // In demo mode without auth, fall back to a stable demo player id so it
        // matches what the coach side uses when picking from mock players.
        if (p) setPlayer(p);
        else setPlayer({
          id: "p1",
          first_name: "Speler",
          last_name: "",
          full_name: "Demo Speler",
          nationality: "Nederlands",
          position: "ST",
          overall_rating: 75,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as PlayerWithDetails);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !player) {
    return (
      <div style={{ padding: 24, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 8 }}>
        <Loader2 size={14} className="animate-spin" /> Plan laden...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sfa-blue)", textTransform: "uppercase" }}>
          Jouw persoonlijk plan
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-2)", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em" }}>
          Het bord van {player.first_name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MapIcon size={12} /> Speel je afspraken af op het veld: mentaal achterin · techniek op het middenveld · tactisch in de aanval
        </div>
      </div>

      <PlanView
        playerId={player.id}
        playerFirstName={player.first_name}
        viewerRole="player"
        viewerName={name}
      />
    </div>
  );
}
