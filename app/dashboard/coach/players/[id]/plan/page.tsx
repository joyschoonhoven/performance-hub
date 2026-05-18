"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPlayerById } from "@/lib/supabase/queries";
import type { PlayerWithDetails } from "@/lib/types";
import { PlanView } from "@/components/plan/PlanView";

export default function CoachPlayerPlanPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null);
  const [coachName, setCoachName] = useState<string>("Coach");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getPlayerById(id);
      if (!cancelled) {
        setPlayer(p);
        setLoading(false);
      }
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
          if (!cancelled && data?.full_name) setCoachName(data.full_name);
        }
      } catch { /* demo mode */ }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div style={{ padding: 24, color: "var(--text-dim)" }}>Laden...</div>;
  }
  if (!player) {
    return (
      <div style={{ padding: 24, color: "var(--text-dim)" }}>
        Speler niet gevonden.{" "}
        <Link href="/dashboard/coach/players" style={{ color: "var(--sfa-blue)" }}>Terug</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Back + header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href={`/dashboard/coach/players/${player.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-2)",
            fontSize: 12,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={13} /> <span className="hidden sm:inline">Terug naar profiel</span><span className="sm:hidden">Terug</span>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sfa-blue)", textTransform: "uppercase" }}>
            Persoonlijk plan
          </div>
          <div className="text-lg sm:text-2xl truncate" style={{ fontWeight: 900, color: "var(--text-2)", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em" }}>
            {player.first_name} {player.last_name}
          </div>
          <div className="hidden sm:flex text-xs" style={{ color: "var(--text-dim)", marginTop: 2, alignItems: "center", gap: 6 }}>
            <MapIcon size={12} /> Quest-paneel · drie missie-categorieën: mentaal, voetbalinhoudelijk en tactisch
          </div>
        </div>
      </div>

      <PlanView
        playerId={player.id}
        playerFirstName={player.first_name}
        viewerRole="coach"
        viewerName={coachName}
      />
    </div>
  );
}
