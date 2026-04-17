import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0d14 0%, #111827 50%, #0a0d14 100%)" }}>
      {/* Left side — branding panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 70%, rgba(0,184,145,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 50%)" }} />
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(0,212,170,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Logo */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "#1e2236", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Image src="/logo.png" alt="Schoonhoven Sports" width={44} height={44} className="object-contain" />
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight">Performance Hub</div>
            <div className="text-xs" style={{ color: "#64748b" }}>Schoonhoven Sports</div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#00b891" }}>Schoonhoven Sports Intelligence</div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Jouw spelers.<br />
              <span style={{ color: "#00b891" }}>Jouw data.</span><br />
              Jouw succes.
            </h2>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-xs">
              Real-time performance tracking, AI-analyse en spelersprofiling voor moderne coaches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["AI Scouting", "Player DNA", "Live Analytics", "Challenges"].map((f) => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}>
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
              <div className="text-xl font-black" style={{ color: "#00b891" }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 lg:hidden" style={{ background: "radial-gradient(circle at 50% 30%, rgba(0,184,145,0.06) 0%, transparent 60%)" }} />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-3 lg:hidden">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "#1e2236" }}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-white font-bold text-sm">Performance Hub</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
