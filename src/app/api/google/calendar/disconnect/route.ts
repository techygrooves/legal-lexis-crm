import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { revokeToken } from "@/lib/google-calendar";

// Disconnects Google Calendar: best-effort revoke at Google's end, then drop
// the per-user row. Existing case_events keep their google_event_id (the
// remote events are not deleted) — reconnecting later resumes syncing future
// edits to those same events.
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`, { status: 303 });
  }

  const { data: row } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (row?.refresh_token) {
    await revokeToken(row.refresh_token);
  }

  await supabase
    .from("google_calendar_tokens")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.redirect(
    `${origin}/settings?googleDisconnected=1`,
    { status: 303 }
  );
}
