"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard, Users, ClipboardList, Brain,
  Trophy, BarChart3, Settings, LogOut, ChevronRight,
  Shield, Star, Target, UserCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === "coach") return [
    { label: "Dashboard", href: "/dashboard/coach", icon: <LayoutDashboard size={18} /> },
    { label: "Mijn Profiel", href: "/dashboard/coach/profile", icon: <UserCircle size={18} /> },
    { label: "Spelers", href: "/dashboard/coach/players", icon: <Users size={18} /> },
    { label: "Evaluaties", href: "/dashboard/coach/evaluations", icon: <ClipboardList size={18} /> },
    { label: "AI Scouting", href: "/dashboard/coach/ai", icon: <Brain size={18} />, badge: "AI" },
    { label: "Analytics", href: "/dashboard/coach/analytics", icon: <BarChart3 size={18} /> },
    { label: "Challenges", href: "/dashboard/coach/challenges", icon: <Trophy size={18} /> },
  ];
  if (role === "player") return [
    { label: "Mijn Dashboard", href: "/dashboard/player", icon: <LayoutDashboard size={18} /> },
    { label: "Player Card", href: "/dashboard/player/card", icon: <Star size={18} /> },
    { label: "Evaluaties", href: "/dashboard/player/evaluations", icon: <ClipboardList size={18} /> },
    { label: "Challenges", href: "/dashboard/player/challenges", icon: <Trophy size={18} /> },
    { label: "Progressie", href: "/dashboard/player/analytics", icon: <BarChart3 size={18} /> },
  ];
  return [
    { label: "Admin Panel", href: "/dashboard/admin", icon: <Shield size={18} /> },
    { label: "Gebruikers", href: "/dashboard/admin/users", icon: <Users size={18} /> },
    { label: "Koppelingen", href: "/dashboard/admin/assignments", icon: <Target size={18} /> },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: <BarChart3 size={18} /> },
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleConfig = {
    coach: { label: "Coach", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: "👨‍💼" },
    player: { label: "Speler", color: "text-indigo-400", bg: "bg-indigo-500/10", icon: "⚽" },
    admin: { label: "Admin", color: "text-amber-400", bg: "bg-amber-500/10", icon: "🛡️" },
  }[role];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0" style={{ background: "linear-gradient(180deg, #141720 0%, #1a1d2e 100%)", borderRight: "1px solid #323754" }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid #323754" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: "#1e2236" }}>
            <Image
              src="/logo.png"
              alt="Schoonhoven Sports"
              width={40}
              height={40}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: "#1e293b" }}>Performance Hub</div>
            <div className="text-xs" style={{ color: "#64748b" }}>Schoonhoven Sports</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/dashboard/${role}` && item.href !== `/dashboard/${role}/profile` && pathname.startsWith(item.href));
          const isExactActive = pathname === item.href;
          const active = isActive || isExactActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "text-slate-900"
                  : "hover:text-slate-900"
              )}
              style={active ? {
                background: "rgba(0, 184, 145, 0.12)",
                border: "1px solid rgba(0, 184, 145, 0.2)",
                color: "#6475f5",
              } : {
                border: "1px solid transparent",
                color: "#64748b",
              }}
            >
              <span style={{ color: active ? "#6475f5" : undefined }}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,184,145,0.15)", color: "#6475f5" }}>
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight size={14} style={{ color: "#6475f5" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 space-y-1.5" style={{ borderTop: "1px solid #323754" }}>
        <Link
          href={`/dashboard/${role}/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "#1e2236"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
        >
          <Settings size={15} />
          <span>Instellingen</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#1e2236", border: "1px solid #323754" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(0,184,145,0.2), rgba(99,102,241,0.2))", color: "#6475f5", border: "1px solid rgba(0,184,145,0.2)" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>{userName}</div>
            <div className={cn("text-xs px-1.5 py-0.5 rounded-md inline-block mt-0.5", roleConfig.bg, roleConfig.color)}>
              {roleConfig.icon} {roleConfig.label}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded transition-colors"
            title="Uitloggen"
            style={{ color: "#4a6080" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#4a6080"; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
