"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserCheck, Trophy } from "lucide-react";
import type { UserRole } from "@/lib/types";

const ACCENT = "#5A90BA";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("player");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

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
    { value: "coach" as UserRole, label: "Trainer", desc: "Beheer spelers & evaluaties", icon: <Trophy size={14} /> },
    { value: "player" as UserRole, label: "Speler", desc: "Volg jouw ontwikkeling", icon: <UserCheck size={14} /> },
  ];

  function inputStyle(field: string): React.CSSProperties {
    const isFocused = focused === field;
    return {
      background: "#FFFFFF",
      border: `1px solid ${isFocused ? ACCENT : "#E5E7EB"}`,
      boxShadow: isFocused ? `0 0 0 3px ${ACCENT}22` : "none",
      color: "#1F2937",
      caretColor: ACCENT,
      borderRadius: 10,
    };
  }

  const labelStyle: React.CSSProperties = {
    color: "#6B7280", letterSpacing: "0.08em",
    fontFamily: "'Oswald', sans-serif", fontWeight: 500, textTransform: "uppercase",
  };

  return (
    <div className="space-y-5">
      {/* Kop */}
      <div className="space-y-1 mb-8">
        <div style={{ width: 40, height: 4, background: ACCENT, transform: "skewX(-12deg)", marginBottom: 16 }} />
        <h1 className="display-font" style={{ fontSize: 32, fontWeight: 600, color: "#1F2937", lineHeight: 1.05 }}>
          Account aanmaken
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Schoonhoven Football Academy</p>
      </div>

      <div className="p-6 space-y-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14 }}>
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Rolkeuze */}
          <div>
            <label className="block text-xs mb-2" style={labelStyle}>Ik ben een</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className="p-3 text-left transition-all"
                  style={{
                    background: role === r.value ? `${ACCENT}10` : "#F7F8FA",
                    border: `1px solid ${role === r.value ? ACCENT : "#E5E7EB"}`,
                    borderRadius: 10, cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5" style={{ color: role === r.value ? ACCENT : "#6B7280" }}>
                    {r.icon}
                    <span className="text-xs font-bold">{r.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Velden */}
          {[
            { id: "fullName", label: "Volledige naam", type: "text", value: fullName, onChange: setFullName, placeholder: "Jan de Vries" },
            { id: "email", label: "E-mail", type: "email", value: email, onChange: setEmail, placeholder: "jan@club.nl" },
            { id: "password", label: "Wachtwoord", type: "password", value: password, onChange: setPassword, placeholder: "Minimaal 6 tekens", minLength: 6 },
          ].map((field) => (
            <div key={field.id}>
              <label className="block text-xs mb-1.5" style={labelStyle}>{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                required
                minLength={field.minLength}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                style={inputStyle(field.id)}
                onFocus={() => setFocused(field.id)}
                onBlur={() => setFocused(null)}
              />
            </div>
          ))}

          {error && (
            <div className="px-4 py-3 text-sm" style={{ background: "rgba(180,83,74,0.07)", border: "1px solid rgba(180,83,74,0.25)", color: "#B4534A", borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cut-btn display-font w-full py-3.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
            style={{ background: ACCENT, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Account aanmaken
          </button>
        </form>
      </div>

      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
        Al een account?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: ACCENT }}>
          Inloggen
        </Link>
      </p>
    </div>
  );
}
