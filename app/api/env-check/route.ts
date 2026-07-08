import { NextResponse } from "next/server";

/** Tijdelijk diagnose-endpoint. Verwijder na gebruik. Toont geen geheimen. */
export async function GET() {
  const key = process.env.RESEND_API_KEY;
  const notifyFrom = process.env.NOTIFY_FROM ?? null;
  const computedFrom = notifyFrom || "Schoonhoven FA <noreply@schoonhovenfootballacademy.com>";
  return NextResponse.json({
    hasResendKey: !!key,
    keyStartsWith: key ? key.slice(0, 3) : null,
    NOTIFY_FROM: notifyFrom,          // null = niet gezet
    afzenderDieDeAppGebruikt: computedFrom,
  });
}
