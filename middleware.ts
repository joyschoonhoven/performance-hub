import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next({ request });

  // Only run Supabase auth if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    // Demo mode — just redirect root
    if (path === "/") return NextResponse.redirect(new URL("/dashboard/coach", request.url));
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = path === "/login" || path === "/register";
  const isDashboard = path.startsWith("/dashboard");
  const isOnboarding = path === "/onboarding";

  // Not logged in → redirect to welcome
  if (!user && isOnboarding) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  // Logged in + on auth page → redirect to dashboard
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role ?? "player";
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  // Root redirect
  if (path === "/") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = profile?.role ?? "player";
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register", "/onboarding"],
};
