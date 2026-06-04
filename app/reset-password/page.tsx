"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase injects the session from the reset link hash automatically
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check if already in a session (hash may have already been processed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 focus:outline-none focus:border-[#4FA9E6] focus:ring-2 focus:ring-[#4FA9E6]/10 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#f1f5f9" }}>
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(rgba(79,169,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,169,230,1) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
            <Image src="/logo.png" alt="Logo" width={52} height={52} className="object-contain w-full h-full" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Nieuw wachtwoord instellen</h1>
          <p className="text-slate-500 text-sm mt-2">Kies een sterk wachtwoord van minimaal 8 tekens.</p>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <div className="text-lg font-bold text-slate-900">Wachtwoord opgeslagen!</div>
              <p className="text-sm text-slate-500">Je wordt doorgestuurd naar de inlogpagina…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-8 space-y-3">
              <Loader2 size={32} className="mx-auto animate-spin text-[#4FA9E6]" />
              <p className="text-sm text-slate-500">Link valideren…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Nieuw wachtwoord
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Minimaal 8 tekens"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Bevestig wachtwoord
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls}
                  placeholder="Herhaal wachtwoord"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-500"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: "#4FA9E6" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Wachtwoord opslaan
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
