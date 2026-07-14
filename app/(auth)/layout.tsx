import Image from "next/image";

const ACCENT = "#5A90BA";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#FFFFFF" }}>
      {/* Links — brandingpaneel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ borderRight: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        {/* Subtiel raster */}
        <div className="absolute inset-0" style={{
          opacity: 0.4,
          backgroundImage: "linear-gradient(#EEF2F6 1px, transparent 1px), linear-gradient(90deg, #EEF2F6 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 100% at 30% 20%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(120% 100% at 30% 20%, #000 40%, transparent 100%)",
        }} />
        {/* Zachte glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: ACCENT, opacity: 0.06, filter: "blur(90px)", transform: "translate(-30%, 30%)" }} />

        {/* Logo + wordmark */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: "#F7F8FA", border: "1px solid #E5E7EB" }}>
            <Image src="/logo.png" alt="Schoonhoven Football Academy" width={44} height={44} className="object-contain" />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div className="font-black" style={{ fontSize: 16, color: "#1F2937", letterSpacing: "0.02em" }}>Performance Hub</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Schoonhoven Football Academy</div>
          </div>
        </div>

        {/* Kop */}
        <div className="relative space-y-6" style={{ maxWidth: 420 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: ACCENT, marginBottom: 14 }}>
              Schoonhoven Football Academy
            </div>
            <h2 className="font-black" style={{ fontSize: 42, color: "#1F2937", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Jouw spelers.<br />
              <span style={{ color: ACCENT }}>Jouw data.</span><br />
              Jouw succes.
            </h2>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: "#6B7280", maxWidth: 340 }}>
              Het performance-platform van de academie — evaluaties, persoonlijke
              plannen en de ontwikkeling van elke speler op één plek.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Spelersontwikkeling", "Evaluaties", "Persoonlijk plan", "Challenges"].map((f) => (
              <span key={f} className="rounded-full" style={{
                fontSize: 12, fontWeight: 600, padding: "7px 15px",
                background: "#F7F8FA", color: "#374151", border: "1px solid #E5E7EB",
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Onder */}
        <div className="relative flex items-center gap-8">
          {[
            { value: "360°", label: "Spelersinzicht" },
            { value: "1-op-1", label: "Begeleiding" },
            { value: "Live", label: "Progressie" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-black" style={{ fontSize: 20, color: ACCENT, letterSpacing: "-0.01em" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rechts — formulier */}
      <div className="flex-1 flex items-center justify-center p-6 pt-24 lg:pt-6 relative" style={{ background: "#F7F8FA" }}>
        {/* Mobiel logo */}
        <div className="absolute top-6 left-6 flex items-center gap-3 lg:hidden">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-bold text-sm" style={{ color: "#1F2937" }}>Performance Hub</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
