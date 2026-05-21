"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { CoachPlansOverview, resolveCoachContext } from "@/components/plan/CoachPlansOverview";

export default function CoachPlansPage() {
  const [coachName, setCoachName] = useState<string>("Coach");
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ctx = await resolveCoachContext();
      if (!cancelled) {
        setCoachName(ctx.name);
        setViewerId(ctx.id);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sfa-blue)", textTransform: "uppercase" }}>
          Persoonlijke plannen
        </div>
        <div className="text-lg sm:text-2xl" style={{ fontWeight: 900, color: "var(--text-2)", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em" }}>
          Alle afspraken in één overzicht
        </div>
        <div className="text-[11px] sm:text-xs" style={{ color: "var(--text-dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
          <Flag size={11} className="shrink-0" />
          <span>Sorteer op deadline, filter op speler of categorie, klik een afspraak voor details + chat.</span>
        </div>
      </div>

      <CoachPlansOverview coachName={coachName} viewerId={viewerId} />
    </div>
  );
}
