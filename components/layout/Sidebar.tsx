"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard, Users, ClipboardList, Brain,
  Trophy, BarChart3, Settings, LogOut,
  Shield, Star, Target, UserCircle, Gamepad2, Map, Swords,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === "coach") return [
    { label: "Dashboard",    href: "/dashboard/coach",             icon: <LayoutDashboard size={16} /> },
    { label: "Profiel",      href: "/dashboard/coach/profile",     icon: <UserCircle size={16} /> },
    { label: "Spelers",      href: "/dashboard/coach/players",     icon: <Users size={16} /> },
    { label: "Wedstrijden",  href: "/dashboard/coach/matches",     icon: <Swords size={16} />, badge: "NEW" },
    { label: "Evaluaties",   href: "/dashboard/coach/evaluations", icon: <ClipboardList size={16} /> },
    { label: "AI Scouting",  href: "/dashboard/coach/ai",          icon: <Brain size={16} />, badge: "AI" },
    { label: "Analytics",    href: "/dashboard/coach/analytics",   icon: <BarChart3 size={16} /> },
    { label: "Challenges",   href: "/dashboard/coach/challenges",  icon: <Trophy size={16} /> },
  ];
  if (role === "player") return [
    { label: "Dashboard",    href: "/dashboard/player",             icon: <LayoutDashboard size={16} /> },
    { label: "Player Card",  href: "/dashboard/player/card",        icon: <Star size={16} /> },
    { label: "Evaluaties",   href: "/dashboard/player/evaluations", icon: <ClipboardList size={16} /> },
    { label: "Challenges",   href: "/dashboard/player/challenges",  icon: <Trophy size={16} /> },
    { label: "Analytics",    href: "/dashboard/player/analytics",   icon: <BarChart3 size={16} />, badge: "NEW" },
    { label: "Tactisch IQ",  href: "/dashboard/player/game",        icon: <Gamepad2 size={16} /> },
    { label: "Heatmap",      href: "/dashboard/player/heatmap",     icon: <Map size={16} /> },
  ];
  return [
    { label: "Admin",        href: "/dashboard/admin",              icon: <Shield size={16} /> },
    { label: "Gebruikers",   href: "/dashboard/admin/users",        icon: <Users size={16} /> },
    { label: "Koppelingen",  href: "/dashboard/admin/assignments",  icon: <Target size={16} /> },
    { label: "Analytics",    href: "/dashboard/admin/analytics",    icon: <BarChart3 size={16} /> },
  ];
}

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, userName, userEmail, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const navItems = getNavItems(role);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside
      style={{
        width: 72,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "linear-gradient(180deg, #001B48 0%, #001234 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 16,
        paddingBottom: 16,
        gap: 0,
      }}
    >
      {/* ── Logo mark ── */}
      <Link href={`/dashboard/${role}`} onClick={onNavigate} style={{ display: "block", marginBottom: 8 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            overflow: "hidden",
            background: "rgba(196,168,79,0.12)",
            border: "1px solid rgba(196,168,79,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ objectFit: "contain" }} />
        </div>
      </Link>

      {/* ── Divider ── */}
      <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" }} />

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%", padding: "0 8px" }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/dashboard/${role}` &&
              item.href !== `/dashboard/${role}/profile` &&
              pathname.startsWith(item.href));

          return (
            <div key={item.href} style={{ position: "relative", width: "100%" }} className="group">
              <Link
                href={item.href}
                onClick={onNavigate}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "8px 4px 6px",
                  borderRadius: 8,
                  gap: 4,
                  background: isActive ? "rgba(196,168,79,0.12)" : "transparent",
                  transition: "background 0.15s",
                  textDecoration: "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    borderRadius: "0 2px 2px 0",
                    background: "#C4A84F",
                  }} />
                )}

                {/* Icon */}
                <span style={{ color: isActive ? "#C4A84F" : "rgba(255,255,255,0.38)", display: "flex" }}>
                  {item.icon}
                </span>

                {/* Label */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    color: isActive ? "#C4A84F" : "rgba(255,255,255,0.28)",
                    lineHeight: 1,
                    textAlign: "center",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  }}
                >
                  {item.label}
                </span>

                {/* Badge dot */}
                {item.badge && (
                  <div style={{
                    position: "absolute",
                    top: 5,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#C4A84F",
                    border: "1.5px solid #001B48",
                  }} />
                )}
              </Link>

              {/* Tooltip on hover */}
              <div
                className="pointer-events-none opacity-0 group-hover:opacity-100"
                style={{
                  position: "absolute",
                  left: "calc(100% + 10px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#0D1117",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "4px 8px",
                  borderRadius: 5,
                  whiteSpace: "nowrap",
                  zIndex: 100,
                  pointerEvents: "none",
                  transition: "opacity 0.12s",
                  letterSpacing: "0.01em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />

      {/* ── Bottom actions ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%", padding: "0 8px" }}>
        {/* Settings */}
        <div style={{ position: "relative", width: "100%" }} className="group">
          <Link
            href={`/dashboard/${role}/settings`}
            onClick={onNavigate}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "8px 4px 6px",
              borderRadius: 8,
              gap: 4,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Settings size={15} style={{ color: "rgba(255,255,255,0.28)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>Inst.</span>
          </Link>
          <div
            className="pointer-events-none opacity-0 group-hover:opacity-100"
            style={{
              position: "absolute",
              left: "calc(100% + 10px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "#0D1117",
              color: "#fff",
              fontSize: 11,
              fontWeight: 500,
              padding: "4px 8px",
              borderRadius: 5,
              whiteSpace: "nowrap",
              zIndex: 100,
              pointerEvents: "none",
              transition: "opacity 0.12s",
            }}
          >
            Instellingen
          </div>
        </div>

        {/* Logout */}
        <div style={{ position: "relative", width: "100%" }} className="group">
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "8px 4px 6px",
              borderRadius: 8,
              gap: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <LogOut size={15} style={{ color: "rgba(255,255,255,0.28)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>Uit</span>
          </button>
          <div
            className="pointer-events-none opacity-0 group-hover:opacity-100"
            style={{
              position: "absolute",
              left: "calc(100% + 10px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "#0D1117",
              color: "#fff",
              fontSize: 11,
              fontWeight: 500,
              padding: "4px 8px",
              borderRadius: 5,
              whiteSpace: "nowrap",
              zIndex: 100,
              pointerEvents: "none",
              transition: "opacity 0.12s",
            }}
          >
            Uitloggen
          </div>
        </div>
      </div>

      {/* ── Avatar ── */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid rgba(196,168,79,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #C4A84F, #8C7535)",
            color: "#001B48",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.02em",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            flexShrink: 0,
          }}
        >
          {avatarUrl
            ? <Image src={avatarUrl} alt={userName} width={32} height={32} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            : initials}
        </div>
      </div>
    </aside>
  );
}
