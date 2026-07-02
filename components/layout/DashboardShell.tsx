"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import type { UserRole } from "@/lib/types";
import {
  X, LogOut, LayoutDashboard, HeartPulse, Star, Flag,
  Users, ClipboardList, BarChart3, ChevronRight, Menu,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard/player":             "Dashboard",
  "/dashboard/player/checkin":     "Check-in",
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
  "/dashboard/coach/plans":        "Plannen",
  "/dashboard/coach/evaluations":  "Evaluaties",
  "/dashboard/coach/ai":           "AI Scouting",
  "/dashboard/coach/analytics":    "Analytics",
  "/dashboard/coach/challenges":   "Challenges",
  "/dashboard/coach/settings":     "Instellingen",
  "/dashboard/admin":              "Admin",
  "/dashboard/admin/users":        "Gebruikers",
  "/dashboard/admin/assignments":  "Koppelingen",
  "/dashboard/admin/analytics":    "Analytics",
};

/* ── Mobile bottom nav items per role ── */
interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getMobileNavItems(role: UserRole): BottomNavItem[] {
  if (role === "player") return [
    { label: "Home",     href: "/dashboard/player",           icon: <LayoutDashboard size={20} /> },
    { label: "Check-in", href: "/dashboard/player/checkin",   icon: <HeartPulse size={20} /> },
    { label: "Card",     href: "/dashboard/player/card",      icon: <Star size={20} /> },
    { label: "Plan",     href: "/dashboard/player/plan",      icon: <Flag size={20} /> },
    { label: "Meer",     href: "#more",                       icon: <Menu size={20} /> },
  ];
  if (role === "coach") return [
    { label: "Home",       href: "/dashboard/coach",              icon: <LayoutDashboard size={20} /> },
    { label: "Spelers",    href: "/dashboard/coach/players",      icon: <Users size={20} /> },
    { label: "Evaluaties", href: "/dashboard/coach/evaluations",  icon: <ClipboardList size={20} /> },
    { label: "Plannen",    href: "/dashboard/coach/plans",        icon: <Flag size={20} /> },
    { label: "Meer",       href: "#more",                         icon: <Menu size={20} /> },
  ];
  return [
    { label: "Admin",     href: "/dashboard/admin",              icon: <Shield size={20} /> },
    { label: "Gebruikers",href: "/dashboard/admin/users",        icon: <Users size={20} /> },
    { label: "Analytics", href: "/dashboard/admin/analytics",    icon: <BarChart3 size={20} /> },
    { label: "Meer",      href: "#more",                         icon: <Menu size={20} /> },
  ];
}

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const mobileNavItems = getMobileNavItems(role);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden lg:flex">
        <Sidebar role={role} userName={userName} userEmail={userEmail} />
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          className="lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <div
        className="lg:hidden"
        style={{
          position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: drawerOpen ? "8px 0 32px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <Sidebar role={role} userName={userName} userEmail={userEmail} onNavigate={() => setDrawerOpen(false)} />
      </div>

      {/* ── MAIN AREA ── */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── TOPBAR ── */}
        <header style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          zIndex: 10,
        }}>
          {/* Left: logo (mobile) + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mobile logo */}
            <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href={`/dashboard/${role}`} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  overflow: "hidden", background: "rgba(27,108,168,0.08)",
                  border: "1px solid rgba(27,108,168,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Image src="/logo.png" alt="Logo" width={24} height={24} style={{ objectFit: "contain" }} />
                </div>
              </Link>
            </div>

            {/* Page title */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="hidden lg:inline" style={{
                fontSize: 11, color: "var(--text-dim)",
                letterSpacing: "0.04em", fontWeight: 500,
              }}>
                Performance Hub
              </span>
              {pageLabel && (
                <>
                  <span className="hidden lg:inline" style={{ color: "var(--border-strong)", fontSize: 12 }}>/</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: "var(--text)", letterSpacing: "-0.01em",
                  }}>
                    {pageLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {role === "player" && playerId && (
              <NotificationBell playerId={playerId} />
            )}

            {/* User chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "4px 10px 4px 5px",
              borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg)", cursor: "default",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "var(--sfa-navy)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.02em", flexShrink: 0,
              }}>
                {initials}
              </div>
              <span className="hidden sm:inline" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
                {firstName}
              </span>
              <span className="hidden sm:inline" style={{
                fontSize: 9, fontWeight: 700, color: "var(--sfa-blue)",
                background: "rgba(27,108,168,0.08)", padding: "2px 6px",
                borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {role === "coach" ? "Coach" : role === "player" ? "Speler" : "Admin"}
              </span>
            </div>

            {/* Logout — desktop only */}
            <button
              className="hidden lg:flex"
              onClick={handleLogout}
              title="Uitloggen"
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-dim)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "var(--red)";
                el.style.borderColor = "rgba(214,64,69,0.3)";
                el.style.background = "rgba(214,64,69,0.05)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "var(--text-dim)";
                el.style.borderColor = "var(--border)";
                el.style.background = "transparent";
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <div
            className="shell-content lg:pb-10"
            style={{ minHeight: "100%", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="px-3 pt-4 sm:px-5 lg:px-7 lg:pt-7">
              {children}
            </div>
          </div>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav
          className="lg:hidden"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 30,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(13,27,42,0.07)",
            display: "flex",
            alignItems: "stretch",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            boxShadow: "0 -4px 24px rgba(13,27,42,0.06)",
          }}
        >
          {mobileNavItems.map((item) => {
            const isMore = item.href === "#more";
            const isActive = !isMore && (
              pathname === item.href ||
              (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href))
            );
            const isMoreActive = drawerOpen;

            return (
              <button
                key={item.href}
                onClick={() => {
                  if (isMore) {
                    setDrawerOpen(!drawerOpen);
                  } else {
                    setDrawerOpen(false);
                    router.push(item.href);
                  }
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  padding: "10px 4px 8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  minHeight: 56,
                }}
              >
                {/* Active dot */}
                {(isActive || isMoreActive && isMore) && (
                  <div style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 20, height: 2,
                    borderRadius: 999,
                    background: "var(--sfa-blue)",
                  }} />
                )}
                <span style={{
                  color: (isActive || (isMoreActive && isMore))
                    ? "var(--sfa-blue)"
                    : "rgba(13,27,42,0.35)",
                  display: "flex",
                  transition: "color 0.15s",
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  color: (isActive || (isMoreActive && isMore))
                    ? "var(--sfa-blue)"
                    : "rgba(13,27,42,0.4)",
                  lineHeight: 1,
                  transition: "color 0.15s",
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </main>
    </div>
  );
}
