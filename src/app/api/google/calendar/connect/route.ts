import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl, isConfigured } from "@/lib/google-calendar";

// Kicks off the Google OAuth consent flow. Generates a short-lived state
// cookie so /callback can verify the redirect actually came from us.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const origin = new URL(request.url).origin;
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!isConfigured()) {
    return NextResponse.redirect(
      `${origin}/settings?googleError=${encodeURIComponent("not-configured")}`
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
