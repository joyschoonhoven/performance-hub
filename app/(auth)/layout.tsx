import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#FFFFFF" }}>
      {/* Links — brandingpaneel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ borderRight: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        {/* Schuine accentvlakken */}
        <div style={{
          position: "absolute", top: 0, right: -60, width: 220, height: "100%",
          background: "linear-gradient(180deg, rgba(90,144,186,0.05), rgba(90,144,186,0.10))",
          transform: "skewX(-12deg)",
        }} />
        <div style={{
          position: "absolute", top: 0, right: 190, width: 22, height: "100%",
          background: "rgba(90,144,186,0.10)", transform: "skewX(-12deg)",
        }} />

        {/* Logo + wordmark */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 overflow-hidden flex items-center justify-center"
            style={{ background: "#F7F8FA", border: "1px solid #E5E7EB", borderRadius: 10 }}>
            <Image src="/logo.png" alt="Schoonhoven Football Academy" width={44} height={44} className="object-contain" />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div className="display-font" style={{ fontSize: 17, fontWeight: 600, color: "#1F2937", letterSpacing: "0.14em" }}>SCHOONHOVEN</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.46em", color: "#5A90BA", marginTop: 3 }}>FOOTBALL ACADEMY</div>
          </div>
        </div>

        {/* Kop */}
        <div className="relative space-y-6" style={{ maxWidth: 420 }}>
          <div>
            <div style={{ width: 44, height: 4, background: "#5A90BA", transform: "skewX(-12deg)", marginBottom: 18 }} />
            <h2 className="display-font" style={{ fontSize: 44, fontWeight: 600, color: "#1F2937", lineHeight: 1.05 }}>
              Presteren<br />begint met<br /><span style={{ color: "#5A90BA" }}>inzicht.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: "#6B7280", maxWidth: 320 }}>
              Het performance-platform van Schoonhoven Football Academy — evaluaties,
              persoonlijke plannen en ontwikkeling van elke speler op één plek.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Spelersontwikkeling", "Evaluaties", "Persoonlijk plan", "Challenges"].map((f) => (
              <span key={f} className="cut-sm display-font" style={{
                fontSize: 11, fontWeight: 600, padding: "7px 16px",
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
              <div className="display-font" style={{ fontSize: 20, fontWeight: 600, color: "#5A90BA" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rechts — formulier */}
      <div className="flex-1 flex items-center justify-center p-6 pt-24 lg:pt-6 relative" style={{ background: "#F7F8FA" }}>
        {/* Mobiel logo */}
        <div className="absolute top-6 left-6 flex items-center gap-3 lg:hidden">
          <div className="w-9 h-9 overflow-hidden flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8 }}>
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <span style={{ lineHeight: 1 }}>
            <span className="display-font block" style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", letterSpacing: "0.12em" }}>SCHOONHOVEN</span>
            <span className="block" style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: "0.4em", color: "#5A90BA", marginTop: 2 }}>FOOTBALL ACADEMY</span>
          </span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
