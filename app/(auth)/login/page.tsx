"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const inputBase = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#F4F5F7",
    caretColor: "#4FA9E6",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain w-full h-full" />
          </div>
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Outfit, sans-serif" }}>
            Performance Hub
          </span>
        </div>
        <h1 className="text-3xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
          Welkom terug
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Log in op jouw dashboard</p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Outfit, sans-serif" }}>
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="naam@club.nl"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              style={inputBase}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(79,169,230,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Outfit, sans-serif" }}>
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all"
                style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(79,169,230,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            style={{ background: "#4FA9E6", color: "#fff", boxShadow: "0 4px 16px rgba(79,169,230,0.3)", fontFamily: "Outfit, sans-serif" }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#2B8AC7"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(79,169,230,0.4)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4FA9E6"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(79,169,230,0.3)"; }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Inloggen</span><ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs" style={{ background: "transparent", color: "rgba(255,255,255,0.2)" }}>of probeer een demo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["coach", "player"] as const).map((role) => (
            <button key={role} onClick={() => demoLogin(role)} disabled={loading}
              className="rounded-xl py-2.5 text-xs font-semibold transition-all disabled:opacity-40 capitalize"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontFamily: "Outfit, sans-serif" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,169,230,0.1)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,169,230,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "#4FA9E6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}>
              {role === "coach" ? "👔 Coach" : "⚽ Speler"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
        Geen account?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: "#4FA9E6" }}>
          Aanmelden
        </Link>
      </p>
    </div>
  );
}
