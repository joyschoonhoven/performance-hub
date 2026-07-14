"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";

const ACCENT = "#5A90BA";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // We melden altijd succes (geen account-enumeratie), tenzij een echte fout optreedt.
    if (resetError && resetError.status && resetError.status >= 500) {
      setError("Er ging iets mis. Probeer het later opnieuw.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: `1px solid ${focused ? ACCENT : "#E5E7EB"}`,
    boxShadow: focused ? `0 0 0 3px ${ACCENT}22` : "none",
    color: "#1F2937",
    caretColor: ACCENT,
    borderRadius: 10,
  };

  const labelStyle: React.CSSProperties = {
    color: "#6B7280", letterSpacing: "0.08em",
    fontFamily: "'Oswald', sans-serif", fontWeight: 500, textTransform: "uppercase",
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="w-14 h-14 flex items-center justify-center cut-sm"
          style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}33`, color: ACCENT }}>
          <MailCheck size={26} />
        </div>
        <div className="space-y-2">
          <h1 className="display-font" style={{ fontSize: 28, fontWeight: 600, color: "#1F2937" }}>Check je e-mail</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            Als er een account bestaat voor <b style={{ color: "#1F2937" }}>{email}</b>, hebben we een link gestuurd
            om je wachtwoord opnieuw in te stellen. Kijk ook even in je spam-map.
          </p>
        </div>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
          <ArrowLeft size={15} /> Terug naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 mb-8">
        <div style={{ width: 40, height: 4, background: ACCENT, transform: "skewX(-12deg)", marginBottom: 16 }} />
        <h1 className="display-font" style={{ fontSize: 30, fontWeight: 600, color: "#1F2937", lineHeight: 1.05 }}>Wachtwoord vergeten?</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Vul je e-mailadres in en we sturen je een herstel-link.</p>
      </div>

      <div className="p-6 space-y-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14 }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-2" style={labelStyle}>
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="naam@club.nl"
              className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
              style={inputStyle}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </div>

          {error && (
            <div className="px-4 py-3 text-sm"
              style={{ background: "rgba(180,83,74,0.07)", border: "1px solid rgba(180,83,74,0.25)", color: "#B4534A", borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="cut-btn display-font w-full py-3.5 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.99]"
            style={{ background: ACCENT, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Stuur herstel-link</span><ArrowRight size={15} /></>}
          </button>
        </form>
      </div>

      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
        Weet je het weer?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: ACCENT }}>
          Terug naar inloggen
        </Link>
      </p>
    </div>
  );
}
