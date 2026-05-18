"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import type { UserRole } from "@/lib/types";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard/player":             "Dashboard",
  "/dashboard/player/checkin":     "Dagelijkse Check-in",
  "/dashboard/player/card":        "Player Card",
  "/dashboard/player/plan":        "Mijn Plan",
  "/dashboard/player/evaluations": "Evaluaties",
  "/dashboard/player/challenges":  "Challenges",
  "/dashboard/player/analytics":   "Analytics",
  "/dashboard/player/game":        "Tactisch IQ",
  "/dashboard/player/heatmap":     "Posities",
  "/dashboard/player/settings":    "Instellingen",
  "/dashboard/coach":              "Dashboard",
  "/dashboard/coach/profile":      "Mijn Profiel",
  "/dashboard/coach/players":      "Spelers",
  "/dashboard/coach/plans":        "Persoonlijke Plannen",
  "/dashboard/coach/matches":      "Wedstrijden",
  "/dashboard/coach/evaluations":  "Evaluaties",
  "/dashboard/coach/ai":           "AI Scouting",
  "/dashboard/coach/analytics":    "Analytics",
  "/dashboard/coach/challenges":   "Challenges",
  "/dashboard/coach/settings":     "Instellingen",
  "/dashboard/admin":              "Admin Panel",
  "/dashboard/admin/users":        "Gebruikers",
  "/dashboard/admin/assignments":  "Koppelingen",
  "/dashboard/admin/analytics":    "Analytics",
};

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if (role !== "player") { setPlayerId(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setPlayerId("p1"); return; }
        const { data } = await supabase
          .from("players").select("id").eq("profile_id", user.id).maybeSingle();
        if (!cancelled) setPlayerId(data?.id ?? "p1");
      } catch {
        if (!cancelled) setPlayerId("p1");
      }
    })();
    return () => { cancelled = true; };
  }, [role, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pageLabel = ROUTE_LABELS[pathname] ?? "";
  const firstName = userName.split(" ")[0];
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            background: "rgba(0,27,72,0.45)",
            backdropFilter: "blur(4px)",
          }}
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar full-width */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 30,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s ease-out",
        }}
      >
        <Sidebar role={role} userName={userName} userEmail={userEmail} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar role={role} userName={userName} userEmail={userEmail} />
      </div>

      {/* Main content area */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            height: 52,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Left: mobile menu + page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-dim)",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                Performance Hub
              </span>
              {pageLabel && (
                <>
                  <span style={{ color: "var(--border-strong)", fontSize: 12 }}>/</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-2)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {pageLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: notifications + user chip + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {role === "player" && playerId && (
              <NotificationBell playerId={playerId} />
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 10px 5px 6px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "var(--navy)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>{firstName}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--sfa-blue)",
                  background: "rgba(77,174,229,0.1)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {role === "coach" ? "Coach" : role === "player" ? "Speler" : "Admin"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Uitloggen"
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-dim)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--red)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "28px 28px 40px", minHeight: "100%" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
