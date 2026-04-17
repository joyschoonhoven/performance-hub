"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "@/lib/types";
import { Menu, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleLabel = role === "coach" ? "Coach" : role === "player" ? "Speler" : "Admin";

  return (
    <div className="flex h-screen bg-hub-bg overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-30 lg:static lg:z-auto lg:flex lg:flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
          style={{ background: "#0f1119", borderBottom: "1px solid #323754" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "#475569" }}
            onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0"; (e.currentTarget as HTMLButtonElement).style.background = "#1e2236"; }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <span className="font-bold text-slate-900 text-sm">Performance Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: "#1e2236", border: "1px solid #323754" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: "rgba(0,184,145,0.2)", color: "#6475f5" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 hidden xs:block">{roleLabel}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl transition-colors"
              style={{ color: "#4a6080" }}
              onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#4a6080"; }}
              title="Uitloggen"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-full p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
