import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles the email-confirmation link from the signup email.
// Verifies the one-time token (which confirms the address), then deliberately
// signs the user out and sends them to the login page with a success banner,
// so they sign in themselves rather than landing on a bare redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
