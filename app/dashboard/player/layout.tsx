"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMyPlayerData } from "@/lib/supabase/queries";

/**
 * Persoonlijkheidstest-gate: de test is een verplicht onderdeel van de
 * aanmelding. Een speler zonder mbti_type wordt naar de test geleid en
 * kan de rest van de omgeving pas in na afronden.
 */
export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const onTestPage = pathname === "/dashboard/player/mbti";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyPlayerData();
        if (cancelled) return;
        if (p && !p.mbti_type && !onTestPage) {
          router.replace("/dashboard/player/mbti?verplicht=1");
          return;
        }
      } catch { /* demo mode — geen gate */ }
      if (!cancelled) setChecked(true);
    })();
    return () => { cancelled = true; };
  }, [pathname, onTestPage, router]);

  // Op de testpagina zelf nooit blokkeren; elders korte check zonder flits van content
  if (!checked && !onTestPage) return null;
  return <>{children}</>;
}
