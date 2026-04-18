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
        <div className="lg:hidden sticky top-0 z-10 bg-white"
          style={{ borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(15,23,42,0.06)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl transition-colors hover:bg-slate-100"
              style={{ color: "#475569" }}
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                <span className="text-white text-[10px] font-black">PH</span>
              </div>
              <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(79,70,229,0.07)", border: "1px solid rgba(79,70,229,0.12)" }}>
                <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-indigo-600">{roleLabel}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-colors hover:bg-red-50"
                style={{ color: "#94a3b8" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                title="Uitloggen"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3 bg-white"
          style={{ borderBottom: "1px solid #e8ecf4", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <span className="text-white text-[10px] font-black">PH</span>
            </div>
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</span>
            <span className="text-slate-300 text-xs mx-1">·</span>
            <span className="text-xs text-slate-400" style={{ fontFamily: "Outfit, sans-serif" }}>Schoonhoven Sports</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.1)" }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-indigo-600" style={{ fontFamily: "Outfit, sans-serif" }}>{userName.split(" ")[0] || roleLabel}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>{roleLabel}</span>
          </div>
        </div>
        <div className="min-h-full p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
