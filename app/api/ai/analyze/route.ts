import { NextRequest, NextResponse } from "next/server";
import { buildAnalysisPrompt, analyzePlayerLocal } from "@/lib/ai-engine";
import type { AIAnalysisInput, AIAnalysisOutput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AIAnalysisInput;

    if (!body.player || !body.evaluations) {
      return NextResponse.json({ error: "Missing player or evaluations" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, fallback to local rule-based engine
    if (!apiKey) {
      const result = analyzePlayerLocal(body);
      return NextResponse.json(result);
    }

    const prompt = buildAnalysisPrompt(body);

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      // Fallback on API error
      const result = analyzePlayerLocal(body);
      return NextResponse.json(result);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    // Parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisOutput;
      return NextResponse.json(parsed);
    } catch {
      // JSON parse failed, use local
      const result = analyzePlayerLocal(body);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
