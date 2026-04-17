import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    const { name, email, role } = body;

    const roleLabel = role === "coach" ? "Coach" : role === "player" ? "Speler" : "Admin";
    const timestamp = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });

    const dashboardUrl = role === "coach"
      ? "https://hub.schoonhovensports.com/dashboard/coach"
      : "https://hub.schoonhovensports.com/dashboard/player";

    // ── Admin notification ──────────────────────────────────────────────
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Performance Hub <noreply@schoonhovensports.com>",
        to: ["voetbalzaken@schoonhovensports.com"],
        subject: `Nieuw account: ${name} (${roleLabel})`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0d1424; color: #e2e8f0; padding: 32px; border-radius: 16px;">
            <div style="border-bottom: 1px solid #1e3058; padding-bottom: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #00b891; font-size: 20px;">Performance Hub</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Schoonhoven Sports</p>
            </div>
            <h3 style="margin: 0 0 16px; color: #fff;">Nieuw account aangemaakt</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;">Naam</td>
                <td style="padding: 10px 0; color: #e2e8f0; font-size: 14px; font-weight: 600;">${name}</td>
              </tr>
              <tr style="border-top: 1px solid #1e3058;">
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">E-mail</td>
                <td style="padding: 10px 0; color: #e2e8f0; font-size: 14px;">${email}</td>
              </tr>
              <tr style="border-top: 1px solid #1e3058;">
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Rol</td>
                <td style="padding: 10px 0; font-size: 14px;">
                  <span style="background: rgba(0,184,145,0.15); color: #00b891; padding: 2px 10px; border-radius: 6px; font-weight: 600;">${roleLabel}</span>
                </td>
              </tr>
              <tr style="border-top: 1px solid #1e3058;">
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Tijdstip</td>
                <td style="padding: 10px 0; color: #e2e8f0; font-size: 14px;">${timestamp}</td>
              </tr>
            </table>
          </div>
        `,
      }),
    });

    // ── Welcome email to the new user ───────────────────────────────────
    const firstName = name.split(" ")[0] ?? name;
    const isCoach = role === "coach";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Performance Hub <noreply@schoonhovensports.com>",
        to: [email],
        subject: `Welkom bij Performance Hub, ${firstName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
          <body style="margin:0; padding:0; background:#0a1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 560px; margin: 40px auto; padding: 0 16px;">

              <!-- Header -->
              <div style="background: #162040; border: 1px solid #1e3058; border-radius: 20px; padding: 40px 36px;">

                <!-- Logo / Brand -->
                <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #1e3058;">
                  <div style="display: inline-flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: rgba(0,184,145,0.12); border: 1px solid rgba(0,184,145,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 20px; height: 20px; background: #00b891; border-radius: 4px;"></div>
                    </div>
                    <span style="font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">Performance Hub</span>
                  </div>
                  <p style="margin: 6px 0 0; color: #4a6080; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Schoonhoven Sports</p>
                </div>

                <!-- Main content -->
                <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 26px; font-weight: 900; line-height: 1.2;">
                  Welkom, ${firstName}!
                </h1>
                <p style="margin: 0 0 28px; color: #7f93b0; font-size: 15px; line-height: 1.6;">
                  Je account is succesvol aangemaakt als <strong style="color: #00b891;">${roleLabel}</strong>.
                  ${isCoach
                    ? "Je kunt nu spelers evalueren, challenges toewijzen en de AI scouting engine gebruiken."
                    : "Je kunt nu je evaluaties inzien, challenges bijhouden en je voortgang volgen."
                  }
                </p>

                <!-- Steps -->
                <div style="margin-bottom: 32px;">
                  ${isCoach ? `
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: rgba(0,184,145,0.06); border: 1px solid rgba(0,184,145,0.15); border-radius: 12px; margin-bottom: 10px;">
                      <div style="width: 28px; height: 28px; background: rgba(0,184,145,0.15); border-radius: 8px; color: #00b891; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">1</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Vul je profiel in</div><div style="color: #5a7090; font-size: 13px;">Club, licentie en coaching achtergrond</div></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: #111d33; border: 1px solid #1e3058; border-radius: 12px; margin-bottom: 10px;">
                      <div style="width: 28px; height: 28px; background: rgba(99,102,241,0.15); border-radius: 8px; color: #6366f1; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">2</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Evalueer je spelers</div><div style="color: #5a7090; font-size: 13px;">Gebruik het scoutingsformulier met 30+ criteria</div></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: #111d33; border: 1px solid #1e3058; border-radius: 12px;">
                      <div style="width: 28px; height: 28px; background: rgba(245,158,11,0.15); border-radius: 8px; color: #f59e0b; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">3</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Wijs challenges toe</div><div style="color: #5a7090; font-size: 13px;">11 maandelijkse trainingsdoelen klaarstaan</div></div>
                    </div>
                  ` : `
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: rgba(0,184,145,0.06); border: 1px solid rgba(0,184,145,0.15); border-radius: 12px; margin-bottom: 10px;">
                      <div style="width: 28px; height: 28px; background: rgba(0,184,145,0.15); border-radius: 8px; color: #00b891; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">1</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Vul je spelersprofiel in</div><div style="color: #5a7090; font-size: 13px;">Positie, geboortedatum en club</div></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: #111d33; border: 1px solid #1e3058; border-radius: 12px; margin-bottom: 10px;">
                      <div style="width: 28px; height: 28px; background: rgba(99,102,241,0.15); border-radius: 8px; color: #6366f1; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">2</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Bekijk je evaluaties</div><div style="color: #5a7090; font-size: 13px;">Zodra je coach je evalueert, zie je dit hier</div></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: #111d33; border: 1px solid #1e3058; border-radius: 12px;">
                      <div style="width: 28px; height: 28px; background: rgba(245,158,11,0.15); border-radius: 8px; color: #f59e0b; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px; flex-shrink: 0;">3</div>
                      <div><div style="color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 2px;">Volg je challenges</div><div style="color: #5a7090; font-size: 13px;">Werk aan je trainingsdoelen en zie je groei</div></div>
                    </div>
                  `}
                </div>

                <!-- CTA Button -->
                <a href="${dashboardUrl}" style="display: block; text-align: center; background: #00b891; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 12px; text-decoration: none;">
                  Naar mijn dashboard →
                </a>

                <!-- Footer -->
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e3058; text-align: center;">
                  <p style="margin: 0; color: #3a5070; font-size: 12px; line-height: 1.6;">
                    Dit is een automatisch bericht van Performance Hub · Schoonhoven Sports<br>
                    Vragen? Stuur een mail naar <a href="mailto:voetbalzaken@schoonhovensports.com" style="color: #00b891; text-decoration: none;">voetbalzaken@schoonhovensports.com</a>
                  </p>
                </div>

              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

  } catch {
    // Don't fail registration if email fails
  }

  return NextResponse.json({ ok: true });
}
