import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
  emailFromIdToken,
  exchangeCodeForTokens,
  fetchPrimaryTimezone,
} from "@/lib/google-calendar";

// Receives Google's auth code, exchanges it for tokens, and upserts the
// per-user row in google_calendar_tokens. The refresh_token is only returned
// on first consent — that's why /connect uses prompt=consent so every connect
// gets one (subsequent reconnects re-use the same row).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.set("google_oauth_state", "", { path: "/", maxAge: 0 });

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/settings?googleError=${encodeURIComponent(oauthError)}`
    );
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      `${origin}/settings?googleError=${encodeURIComponent("invalid-state")}`
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // User had already granted access and Google declined to mint a new
      // refresh token. Tell them to remove the app from their Google account
      // and reconnect; otherwise we'd have no way to sync going forward.
      return NextResponse.redirect(
        `${origin}/settings?googleError=${encodeURIComponent("no-refresh-token")}`
      );
    }
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();
    const timezone = await fetchPrimaryTimezone(tokens.access_token);
    const googleEmail = emailFromIdToken(tokens.id_token);

    const { error } = await supabase
      .from("google_calendar_tokens")
      .upsert(
        {
          user_id: user.id,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          expires_at: expiresAt,
          calendar_id: "primary",
          calendar_timezone: timezone,
          google_email: googleEmail,
        },
        { onConflict: "user_id" }
      );
    if (error) {
      console.error("Saving Google tokens failed:", error);
      return NextResponse.redirect(
        `${origin}/settings?googleError=${encodeURIComponent("save-failed")}`
      );
    }

    return NextResponse.redirect(`${origin}/settings?googleConnected=1`);
  } catch (err) {
    console.error("Google OAuth callback errored:", err);
    return NextResponse.redirect(
      `${origin}/settings?googleError=${encodeURIComponent("exchange-failed")}`
    );
  }
}
