import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#0A2540" }}>
      {/* Left side — branding panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(79,169,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,169,230,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        {/* Glow spots */}
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(79,169,230,0.08), transparent)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: "#4FA9E6", filter: "blur(80px)", transform: "translate(-30%, 30%)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src="/logo.png" alt="Schoonhoven Sports" width={44} height={44} className="object-contain" />
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Schoonhoven Sports</div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4FA9E6", fontFamily: "Outfit, sans-serif" }}>
              Schoonhoven Sports Intelligence
            </div>
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
              Jouw spelers.<br />
              <span style={{ color: "#4FA9E6" }}>Jouw data.</span><br />
              Jouw succes.
            </h2>
            <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Real-time performance tracking, AI-analyse en spelersprofiling voor moderne coaches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["AI Scouting", "Player DNA", "Live Analytics", "Challenges"].map((f) => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(79,169,230,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(79,169,230,0.15)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex items-center gap-8">
          {[
            { value: "360°", label: "Spelersinzicht" },
            { value: "AI", label: "Analyse engine" },
            { value: "Live", label: "Progressie" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-black" style={{ color: "#4FA9E6", fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative"
        style={{ background: "linear-gradient(135deg, #0D2D4D 0%, #0A2540 100%)" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, rgba(79,169,230,1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-3 lg:hidden">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-white font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Performance Hub</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
