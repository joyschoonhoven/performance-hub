"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserCheck, Trophy } from "lucide-react";
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
    fetch("/api/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fullName, email, role }),
    }).catch(() => {});
    router.push(`/onboarding`);
    router.refresh();
  }

  const roles = [
    { value: "coach" as UserRole, label: "Coach", desc: "Beheer spelers & evaluaties", icon: <Trophy size={14} /> },
    { value: "player" as UserRole, label: "Speler", desc: "Bekijk jouw stats & progressie", icon: <UserCheck size={14} /> },
  ];

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-1"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Image src="/logo.png" alt="Schoonhoven Sports" width={52} height={52} className="object-contain w-full h-full" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
            Account aanmaken
          </h1>
          <p className="text-slate-400 text-sm mt-1">Schoonhoven Sports Performance Hub</p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">
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
                  background: "rgba(79,169,230,0.15)",
                  border: "1px solid rgba(79,169,230,0.4)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5" style={{ color: role === r.value ? "#4FA9E6" : "#94A3B8" }}>
                  {r.icon}
                  <span className="text-xs font-bold">{r.label}</span>
                </div>
                <div className="text-[10px] text-slate-500">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        {[
          { id: "fullName", label: "Volledige naam", type: "text", value: fullName, onChange: setFullName, placeholder: "Jan de Vries" },
          { id: "email", label: "E-mail", type: "email", value: email, onChange: setEmail, placeholder: "jan@club.nl" },
          { id: "password", label: "Wachtwoord", type: "password", value: password, onChange: setPassword, placeholder: "Minimaal 6 tekens", minLength: 6 },
        ].map((field) => (
          <div key={field.id}>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
              {field.label}
            </label>
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              minLength={field.minLength}
              placeholder={field.placeholder}
              className="w-full rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(79,169,230,0.5)";
                e.currentTarget.style.background = "rgba(79,169,230,0.08)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,169,230,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        ))}

        {error && (
          <div className="rounded-xl px-4 py-3 text-red-400 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm text-white"
          style={{
            background: loading ? "rgba(79,169,230,0.7)" : "#4FA9E6",
            boxShadow: "0 4px 16px rgba(79,169,230,0.3)",
            fontFamily: "Outfit, sans-serif",
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#2B8AC7"; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#4FA9E6"; }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Account aanmaken
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Al een account?{" "}
        <Link href="/login" className="font-semibold transition-colors" style={{ color: "#4FA9E6" }}>
          Inloggen
        </Link>
      </p>
    </div>
  );
}
