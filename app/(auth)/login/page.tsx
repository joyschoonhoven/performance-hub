"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const role = profile?.role ?? "player";
      router.push(`/dashboard/${role}`);
      router.refresh();
    }
  }

  async function demoLogin(role: "coach" | "player" | "admin") {
    setLoading(true);
    setError("");
    const demos: Record<string, { email: string; password: string }> = {
      coach: { email: "coach@demo.hub", password: "demo1234" },
      player: { email: "player@demo.hub", password: "demo1234" },
      admin: { email: "admin@demo.hub", password: "demo1234" },
    };
    const { email: dEmail, password: dPass } = demos[role];
    const { error: authError } = await supabase.auth.signInWithPassword({ email: dEmail, password: dPass });
    if (authError) {
      setError("Demo account niet beschikbaar. Zie README voor setup.");
      setLoading(false);
      return;
    }
    router.push(`/dashboard/${role}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Logo + Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-2"
          style={{ background: "#262b42", border: "1px solid #323754" }}>
          <Image
            src="/logo.png"
            alt="Schoonhoven Sports"
            width={64}
            height={64}
            className="object-contain w-full h-full"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Performance Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Schoonhoven Sports Intelligence</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#262b42", border: "1px solid #323754" }}>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="coach@club.nl"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
              style={{ background: "#20243a", border: "1px solid #323754" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00b891"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#323754"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                style={{ background: "#20243a", border: "1px solid #323754" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00b891"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#323754"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#4a6080" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7f93b0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#4a6080"; }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-red-400 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
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
            Inloggen
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: "#323754" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs text-slate-500" style={{ background: "#262b42" }}>of probeer demo</span>
          </div>
        </div>

        {/* Demo buttons */}
        <div className="grid grid-cols-3 gap-2">
          {(["coach", "player", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => demoLogin(role)}
              disabled={loading}
              className="rounded-xl py-2.5 text-xs font-semibold text-slate-300 transition-all capitalize disabled:opacity-50"
              style={{ background: "#20243a", border: "1px solid #323754" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#00b891"; (e.currentTarget as HTMLButtonElement).style.color = "#00b891"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#323754"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            >
              {role === "coach" ? "Coach" : role === "player" ? "Speler" : "Admin"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Geen account?{" "}
        <Link href="/register" className="text-hub-teal hover:underline font-medium">
          Aanmelden
        </Link>
      </p>
    </div>
  );
}
