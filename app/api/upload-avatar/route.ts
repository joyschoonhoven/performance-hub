import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Geen bestand meegestuurd" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Alleen JPG, PNG, WebP en GIF zijn toegestaan" }, { status: 400 });
    }

    // Validate file size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Bestand is te groot (max 5 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // Store under the user's own folder so RLS passes
    const path = `${user.id}/avatar.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-avatar] storage error:", uploadError);
      return NextResponse.json(
        { error: `Upload mislukt: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL with cache-buster
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    // Update the profile's avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);

    if (updateError) {
      console.error("[upload-avatar] profile update error:", updateError);
      // URL is still usable even if profile update fails
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload-avatar] unexpected error:", err);
    return NextResponse.json({ error: "Onverwachte fout bij upload" }, { status: 500 });
  }
}
