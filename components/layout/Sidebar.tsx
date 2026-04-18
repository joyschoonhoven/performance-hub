"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard, Users, ClipboardList, Brain,
  Trophy, BarChart3, Settings, LogOut,
  Shield, Star, Target, UserCircle, Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === "coach") return [
    { label: "Dashboard", href: "/dashboard/coach", icon: <LayoutDashboard size={16} /> },
    { label: "Mijn Profiel", href: "/dashboard/coach/profile", icon: <UserCircle size={16} /> },
    { label: "Spelers", href: "/dashboard/coach/players", icon: <Users size={16} /> },
    { label: "Evaluaties", href: "/dashboard/coach/evaluations", icon: <ClipboardList size={16} /> },
    { label: "AI Scouting", href: "/dashboard/coach/ai", icon: <Brain size={16} />, badge: "AI" },
    { label: "Analytics", href: "/dashboard/coach/analytics", icon: <BarChart3 size={16} /> },
    { label: "Challenges", href: "/dashboard/coach/challenges", icon: <Trophy size={16} /> },
  ];
  if (role === "player") return [
    { label: "Dashboard", href: "/dashboard/player", icon: <LayoutDashboard size={16} /> },
    { label: "Player Card", href: "/dashboard/player/card", icon: <Star size={16} /> },
    { label: "Evaluaties", href: "/dashboard/player/evaluations", icon: <ClipboardList size={16} /> },
    { label: "Challenges", href: "/dashboard/player/challenges", icon: <Trophy size={16} /> },
    { label: "Progressie", href: "/dashboard/player/analytics", icon: <BarChart3 size={16} /> },
  ];
  return [
    { label: "Admin Panel", href: "/dashboard/admin", icon: <Shield size={16} /> },
    { label: "Gebruikers", href: "/dashboard/admin/users", icon: <Users size={16} /> },
    { label: "Koppelingen", href: "/dashboard/admin/assignments", icon: <Target size={16} /> },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: <BarChart3 size={16} /> },
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
    async function loadAvatar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    }
    loadAvatar();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleConfig = {
    coach: { label: "Coach", color: "#4FA9E6", bg: "rgba(79,169,230,0.15)" },
    player: { label: "Speler", color: "#93C5FD", bg: "rgba(147,197,253,0.12)" },
    admin: { label: "Admin", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  }[role];

  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0" style={{
      background: "linear-gradient(180deg, #0A2540 0%, #0D2D4D 100%)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain w-full h-full" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Schoonhoven Sports</div>
          </div>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Outfit, sans-serif" }}>
          Menu
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/dashboard/${role}` && item.href !== `/dashboard/${role}/profile` && pathname.startsWith(item.href));
          const active = isActive || pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative"
              style={active ? {
                background: "rgba(79,169,230,0.14)",
                border: "1px solid rgba(79,169,230,0.22)",
                color: "#4FA9E6",
                fontFamily: "Outfit, sans-serif",
              } : {
                border: "1px solid transparent",
                color: "rgba(255,255,255,0.42)",
                fontFamily: "Outfit, sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.42)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: "#4FA9E6" }} />
              )}
              <span style={{ color: active ? "#4FA9E6" : undefined }}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                  style={{ background: "rgba(79,169,230,0.15)", color: "#4FA9E6" }}>
                  <Sparkles size={9} /> {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
        <Link
          href={`/dashboard/${role}/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Outfit, sans-serif" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Settings size={15} />
          <span>Instellingen</span>
        </Link>

        {/* User card */}
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
            style={avatarUrl ? {} : { background: "linear-gradient(135deg, #4FA9E6, #0A2540)" }}>
            {avatarUrl
              ? <Image src={avatarUrl} alt={userName} width={32} height={32} className="object-cover w-full h-full" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{userName}</div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mt-0.5"
              style={{ background: roleConfig.bg, color: roleConfig.color, fontFamily: "Outfit, sans-serif" }}>
              {roleConfig.label}
            </span>
          </div>
          <button onClick={handleLogout} title="Uitloggen"
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
