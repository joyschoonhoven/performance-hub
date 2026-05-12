import Link from "next/link";

const previews = [
  {
    href: "/design/player-card",
    title: "Player Card",
    subtitle: "Hero player profile",
    accent: "#4DAEE5",
    status: "v1",
  },
  {
    href: "/design/coach-dashboard",
    title: "Coach Dashboard",
    subtitle: "Squad command center",
    accent: "#F0A500",
    status: "coming",
  },
];

export default function DesignIndexPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0A0E14 0%, #0D1B2A 100%)",
      color: "#fff",
      padding: "80px 24px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{
          fontSize: 10,
          letterSpacing: "0.24em",
          fontWeight: 600,
          color: "#4DAEE5",
          marginBottom: 16,
          textTransform: "uppercase",
        }}>
          SFA · Design Preview
        </div>
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: 16,
        }}>
          Design system<br />
          <span style={{ color: "#4DAEE5", fontStyle: "italic", fontWeight: 300 }}>preview</span>
        </h1>
        <p style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.6)",
          maxWidth: 540,
          marginBottom: 64,
        }}>
          Static mockups. Iterate on the visual language here.
          Once approved, propagate to the live app.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {previews.map((p) => (
            <Link
              key={p.href}
              href={p.status === "coming" ? "#" : p.href}
              style={{
                display: "block",
                padding: "28px 32px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                textDecoration: "none",
                color: "#fff",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
                opacity: p.status === "coming" ? 0.4 : 1,
                pointerEvents: p.status === "coming" ? "none" : "auto",
              }}
              className="design-tile"
            >
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 3,
                height: "100%",
                background: p.accent,
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {p.title}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 4,
                  }}>
                    {p.subtitle}
                  </div>
                </div>
                <div style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                  color: p.accent,
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: `${p.accent}14`,
                  border: `1px solid ${p.accent}30`,
                }}>
                  {p.status === "coming" ? "Soon" : p.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `.design-tile:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(77,174,229,0.3) !important; }`
      }} />
    </div>
  );
}
