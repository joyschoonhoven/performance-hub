"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

const ACCENT = "#5A90BA";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      router.push(`/dashboard/${profile?.role ?? "player"}`);
      router.refresh();
    }
  }

  async function demoLogin(role: "coach" | "player") {
    setLoading(true);
    setError("");
    const demos = { coach: { email: "coach@demo.hub", password: "demo1234" }, player: { email: "player@demo.hub", password: "demo1234" } };
    const { error: authError } = await supabase.auth.signInWithPassword(demos[role]);
    if (authError) { setError("Demo account niet beschikbaar."); setLoading(false); return; }
    router.push(`/dashboard/${role}`);
    router.refresh();
  }

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
          Welkom terug
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Log in op jouw omgeving</p>
      </div>

      {/* Formulier */}
      <div className="p-6 space-y-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14 }}>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs mb-2" style={labelStyle}>E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="naam@club.nl"
              className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
              style={inputStyle("email")}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs" style={labelStyle}>Wachtwoord</label>
              <Link href="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                Wachtwoord vergeten?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                style={inputStyle("password")}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9CA3AF" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 text-sm" style={{ background: "rgba(180,83,74,0.07)", border: "1px solid rgba(180,83,74,0.25)", color: "#B4534A", borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="cut-btn display-font w-full py-3.5 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
            style={{ background: ACCENT, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Inloggen</span><ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: "1px solid #E5E7EB" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs" style={{ background: "#FFFFFF", color: "#9CA3AF" }}>of probeer een demo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["coach", "player"] as const).map((role) => (
            <button key={role} onClick={() => demoLogin(role)} disabled={loading}
              className="cut-sm display-font py-2.5 text-xs transition-all disabled:opacity-40"
              style={{ background: "#F7F8FA", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
              {role === "coach" ? "Trainer" : "Speler"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
        Geen account?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: ACCENT }}>
          Aanmelden
        </Link>
      </p>
    </div>
  );
}
