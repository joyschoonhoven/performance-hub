import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { UserRole } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let role: UserRole = "coach";
  let userName = "Demo Coach";
  let userEmail = "coach@demo.hub";

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single();

      if (profile) {
        role = profile.role as UserRole;
        userName = profile.full_name;
        userEmail = profile.email;
      } else {
        // Profile doesn't exist yet — use user metadata
        role = (user.user_metadata?.role as UserRole) ?? "player";
        userName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Gebruiker";
        userEmail = user.email ?? "";
      }
    } else {
      // No user → middleware should have redirected, but fallback to login
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
        redirect("/auth/login");
      }
      // Demo mode fallback
    }
  } catch {
    // Supabase not configured — demo mode
  }

  return (
    <DashboardShell role={role} userName={userName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
