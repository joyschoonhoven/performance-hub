"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("player");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    // Notify admin of new signup (fire-and-forget)
    fetch("/api/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fullName, email, role }),
    }).catch(() => {});
    router.push(`/onboarding`);
    router.refresh();
  }

  const roles = [
    { value: "coach" as UserRole, label: "Coach", desc: "Beheer spelers & evaluaties" },
    { value: "player" as UserRole, label: "Speler", desc: "Bekijk jouw stats & progressie" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-2"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <Image src="/logo.png" alt="Schoonhoven Sports" width={64} height={64} className="object-contain w-full h-full" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Account aanmaken</h1>
          <p className="text-slate-400 text-sm mt-1">Schoonhoven Sports Performance Hub</p>
        </div>
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Ik ben een
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={role === r.value ? {
                    background: "rgba(0,184,145,0.12)",
                    border: "1px solid rgba(0,184,145,0.3)",
                  } : {
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: role === r.value ? "#00b891" : "#e2e8f0" }}>{r.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Volledige naam
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jan de Vries"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00b891"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#323754"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jan@club.nl"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00b891"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#323754"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimaal 6 tekens"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00b891"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#323754"; }}
            />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-red-400 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            style={{ background: "#00b891", color: "#fff" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Account aanmaken
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500">
        Al een account?{" "}
        <Link href="/login" className="text-hub-teal hover:underline font-medium">
          Inloggen
        </Link>
      </p>
    </div>
  );
}
