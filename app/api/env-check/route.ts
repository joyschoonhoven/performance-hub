import { NextResponse } from "next/server";

/**
 * Tijdelijk diagnose-endpoint. Toont NIET de sleutel — alleen of de app 'm ziet.
 * Verwijder dit bestand zodra alles werkt.
 */
export async function GET() {
  const key = process.env.RESEND_API_KEY;
  return NextResponse.json({
    hasResendKey: !!key,
    keyLength: key ? key.length : 0,
    startsWith: key ? key.slice(0, 3) : null,   // "re_" bij een geldige Resend-sleutel
  });
}
