"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CommunityBoard } from "@/components/player/CommunityBoard";

export default function CommunityPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          const { data } = await sb.from("players").select("id").eq("profile_id", user.id).maybeSingle();
          setPlayerId(data?.id ?? "");
        } else {
          setPlayerId("");
        }
      } catch {
        setPlayerId("");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: "#5A90BA" }} />
      </div>
    );
  }

  return (
    <div style={{ margin: "-16px -12px -16px", background: "#F4F7FA", minHeight: "100%", paddingBottom: 60 }}>
      <CommunityBoard currentPlayerId={playerId ?? ""} />
    </div>
  );
}
