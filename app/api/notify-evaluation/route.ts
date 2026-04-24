import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    const {
      coachName,
      playerName,
      playerEmail,
      overallScore,
      scores,
      notes,
      strengths,
      improvementPoints,
      evaluationDate,
    } = body as {
      playerId: string;
      coachName: string;
      playerName: string;
      playerEmail: string;
      overallScore: number;
      scores: { category: string; score: number }[];
      notes?: string | null;
      strengths?: string | null;
      improvementPoints?: string | null;
      evaluationDate: string;
    };

    const firstName = playerName.split(" ")[0] ?? playerName;

    const scoreColor =
      overallScore >= 8 ? "#d97706" : overallScore >= 7 ? "#00b891" : "#4FA9E6";

    const categoryDutchLabels: Record<string, string> = {
      techniek: "Techniek",
      fysiek:   "Fysiek",
      tactiek:  "Tactiek",
      mentaal:  "Mentaal",
      teamplay: "Teamplay",
    };

    const scoresTableRows = (scores ?? [])
      .map((s) => {
        const label = categoryDutchLabels[s.category] ?? s.category;
        const sc =
          s.score >= 8 ? "#d97706" : s.score >= 7 ? "#00b891" : "#4FA9E6";
        return `
          <tr style="border-top: 1px solid #1e3058;">
            <td style="padding: 10px 0; color: #7f93b0; font-size: 14px;">${label}</td>
            <td style="padding: 10px 0; text-align: right;">
              <span style="font-weight: 900; font-size: 15px; color: ${sc}; font-family: Outfit, sans-serif;">${s.score.toFixed(1)}</span>
              <span style="color: #3a5070; font-size: 12px;">/10</span>
            </td>
          </tr>`;
      })
      .join("");

    const notesSection = notes
      ? `
        <div style="margin-bottom: 20px; padding: 16px 20px; background: #111d33; border-left: 3px solid #1e3058; border-radius: 0 12px 12px 0;">
          <div style="color: #4a6080; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Notities van je coach</div>
          <p style="margin: 0; color: #7f93b0; font-size: 14px; line-height: 1.6; font-style: italic;">&ldquo;${notes}&rdquo;</p>
        </div>`
      : "";

    const strengthsSection = strengths
      ? `
        <div style="margin-bottom: 20px; padding: 16px 20px; background: rgba(0,184,145,0.06); border: 1px solid rgba(0,184,145,0.2); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #00b891;"></div>
            <div style="color: #00b891; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Sterke punten</div>
          </div>
          <p style="margin: 0; color: #7f93b0; font-size: 14px; line-height: 1.6;">${strengths}</p>
        </div>`
      : "";

    const improvementSection = improvementPoints
      ? `
        <div style="margin-bottom: 20px; padding: 16px 20px; background: rgba(79,169,230,0.06); border: 1px solid rgba(79,169,230,0.2); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #4FA9E6;"></div>
            <div style="color: #4FA9E6; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Verbeterpunten</div>
          </div>
          <p style="margin: 0; color: #7f93b0; font-size: 14px; line-height: 1.6;">${improvementPoints}</p>
        </div>`
      : "";

    const formattedDate = evaluationDate
      ? new Date(evaluationDate).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Performance Hub <noreply@schoonhovensports.com>",
        to: [playerEmail],
        subject: `Nieuwe evaluatie van je coach, ${firstName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
          <body style="margin:0; padding:0; background:#0a1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="max-width: 560px; margin: 40px auto; padding: 0 16px;">

              <!-- Card -->
              <div style="background: #162040; border: 1px solid #1e3058; border-radius: 20px; padding: 40px 36px;">

                <!-- Brand header -->
                <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #1e3058;">
                  <div style="display: inline-flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: rgba(0,184,145,0.12); border: 1px solid rgba(0,184,145,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 20px; height: 20px; background: #00b891; border-radius: 4px;"></div>
                    </div>
                    <span style="font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.5px;">Performance Hub</span>
                  </div>
                  <p style="margin: 6px 0 0; color: #4a6080; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Schoonhoven Sports</p>
                </div>

                <!-- Intro -->
                <h1 style="margin: 0 0 6px; color: #ffffff; font-size: 24px; font-weight: 900; line-height: 1.2;">
                  Hé ${firstName}, je hebt een nieuwe evaluatie!
                </h1>
                <p style="margin: 0 0 28px; color: #7f93b0; font-size: 15px; line-height: 1.6;">
                  ${coachName ? `<strong style="color: #fff;">${coachName}</strong> heeft je beoordeeld` : "Je coach heeft je beoordeeld"}${formattedDate ? ` op <strong style="color: #fff;">${formattedDate}</strong>` : ""}.
                </p>

                <!-- Overall score -->
                <div style="margin-bottom: 28px; padding: 24px; background: #111d33; border: 1px solid #1e3058; border-radius: 16px; text-align: center;">
                  <div style="color: #4a6080; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Overall Score</div>
                  <div style="font-size: 64px; font-weight: 900; line-height: 1; color: ${scoreColor}; font-family: Outfit, sans-serif; letter-spacing: -2px;">
                    ${overallScore.toFixed(1)}
                  </div>
                  <div style="color: #3a5070; font-size: 14px; margin-top: 4px;">van de 10</div>
                </div>

                <!-- Category scores table -->
                ${
                  scores && scores.length > 0
                    ? `
                <div style="margin-bottom: 24px;">
                  <div style="color: #4a6080; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Categorie scores</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${scoresTableRows}
                  </table>
                </div>`
                    : ""
                }

                <!-- Notes / strengths / improvement -->
                ${notesSection}
                ${strengthsSection}
                ${improvementSection}

                <!-- CTA -->
                <a href="https://performance-hub-mu.vercel.app/dashboard/player/evaluaties"
                  style="display: block; text-align: center; background: #00b891; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 12px; text-decoration: none; margin-bottom: 0;">
                  Bekijk mijn evaluatie →
                </a>

                <!-- Footer -->
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e3058; text-align: center;">
                  <p style="margin: 0; color: #3a5070; font-size: 12px; line-height: 1.6;">
                    Dit is een automatisch bericht van Performance Hub · Schoonhoven Sports<br>
                    Vragen? Mail <a href="mailto:voetbalzaken@schoonhovensports.com" style="color: #00b891; text-decoration: none;">voetbalzaken@schoonhovensports.com</a>
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
    // Don't fail if email sending fails
  }

  return NextResponse.json({ ok: true });
}
