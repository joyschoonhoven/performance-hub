import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI generatie niet geconfigureerd" }, { status: 503 });
    }

    const { imageUrl, playerName } = await request.json() as { imageUrl: string; playerName?: string };
    if (!imageUrl) {
      return NextResponse.json({ error: "Geen afbeelding URL opgegeven" }, { status: 400 });
    }

    // Fetch the source image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Kon bronafbeelding niet ophalen");
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBlob = new Blob([imgBuffer], { type: "image/png" });

    // Call OpenAI image editing API
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("image[]", imgBlob, "player.png");
    formData.append(
      "prompt",
      `Professional football / soccer player card photo. Transform this into a cinematic football player portrait: the person wearing a modern football kit with the colors blue and white, stadium lights in the background with bokeh effect, dramatic lighting from above, professional photography style, sharp focus on player, looking confident and athletic. Keep the person's face and likeness. The player is ${playerName ?? "a football player"}. High quality, 8K, photorealistic.`
    );
    formData.append("n", "1");
    formData.append("size", "1024x1024");

    const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({})) as { error?: { message?: string } };
      console.error("[generate-player-photo] OpenAI error:", err);
      return NextResponse.json({ error: err.error?.message ?? "AI generatie mislukt" }, { status: 500 });
    }

    const result = await openaiRes.json() as { data?: { url?: string; b64_json?: string }[] };
    const generated = result.data?.[0];

    if (!generated) {
      return NextResponse.json({ error: "Geen resultaat van AI" }, { status: 500 });
    }

    // Upload the generated image to Supabase Storage
    let buffer: Uint8Array;
    if (generated.b64_json) {
      const binary = atob(generated.b64_json);
      buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    } else if (generated.url) {
      const genRes = await fetch(generated.url);
      buffer = new Uint8Array(await genRes.arrayBuffer());
    } else {
      return NextResponse.json({ error: "Geen afbeelding ontvangen" }, { status: 500 });
    }

    const path = `${user.id}/avatar_ai.png`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[generate-player-photo] storage error:", uploadError);
      return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    // Update profile
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[generate-player-photo] unexpected error:", err);
    return NextResponse.json({ error: "Onverwachte fout" }, { status: 500 });
  }
}
