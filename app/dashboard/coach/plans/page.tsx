"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { CoachPlansOverview, resolveCoachContext } from "@/components/plan/CoachPlansOverview";
import { CoachAgenda } from "@/components/plan/CoachAgenda";

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
    <div className="flex flex-col gap-4" style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>Plannen</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
          <Flag size={12} className="shrink-0" />
          <span>Agenda, beschikbaarheid en persoonlijke plannen van je spelers.</span>
        </div>
      </div>

      <CoachAgenda />

      <CoachPlansOverview coachName={coachName} viewerId={viewerId} />
    </div>
  );
}
