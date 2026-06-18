import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isConfigured as googleConfigured } from "@/lib/google-calendar";
import { DisplayNameForm } from "./display-name-form";
import { GoogleCalendarCard } from "./google-calendar-card";

const googleErrorMessages: Record<string, string> = {
  "not-configured":
    "Google Calendar isn't configured for this deployment yet.",
  "invalid-state":
    "The Google sign-in link expired or was tampered with. Please try again.",
  "no-refresh-token":
    "Google didn't return a refresh token. Remove this app from https://myaccount.google.com/permissions and try Connect again.",
  "save-failed":
    "Could not save the Google Calendar connection. The most common cause is that the database migration supabase/migrations/20260615000000_google_calendar.sql hasn't been run yet — apply it in the Supabase SQL Editor and try again.",
  "exchange-failed":
    "Could not finish Google sign-in. Please try again.",
  "access_denied":
    "Permission was denied during the Google consent screen.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "";

  const accountRows: [string, string][] = [
    ["Email", user.email ?? "—"],
    [
      "Account created",
      user.created_at
        ? format(parseISO(user.created_at), "MMMM d, yyyy")
        : "—",
    ],
    [
      "Last signed in",
      user.last_sign_in_at
        ? format(parseISO(user.last_sign_in_at), "MMMM d, yyyy 'at' h:mm a")
        : "—",
    ],
  ];

  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("google_email")
    .eq("user_id", user.id)
    .maybeSingle();

  const params = await searchParams;
  const pickFirst = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const googleErrorParam = pickFirst(params.googleError);
  const googleErrorDetail = pickFirst(params.googleErrorDetail);
  const googleConnected = pickFirst(params.googleConnected) === "1";
  const googleDisconnected = pickFirst(params.googleDisconnected) === "1";

  const baseGoogleError =
    googleErrorParam &&
    (googleErrorMessages[googleErrorParam] ??
      `Google Calendar error: ${googleErrorParam}`);

  const googleStatus = googleErrorParam
    ? {
        kind: "error" as const,
        message: googleErrorDetail
          ? `${baseGoogleError} (Reported by Supabase: ${googleErrorDetail})`
          : baseGoogleError!,
      }
    : googleConnected
      ? {
          kind: "connected" as const,
          message: "Google Calendar is connected. New events will sync.",
        }
      : googleDisconnected
        ? {
            kind: "disconnected" as const,
            message: "Google Calendar is disconnected.",
          }
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            The signed-in attorney account for this practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="space-y-3">
            {accountRows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-3 border-b pb-2 text-sm last:border-b-0"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="pt-1 text-xs text-muted-foreground">
            User ID: <span className="font-mono">{user.id}</span>
          </p>
        </CardContent>
      </Card>

      <DisplayNameForm initialName={displayName} />

      <GoogleCalendarCard
        isConnected={Boolean(tokenRow)}
        googleEmail={tokenRow?.google_email ?? null}
        status={googleStatus}
        configured={googleConfigured()}
      />
    </div>
  );
}
