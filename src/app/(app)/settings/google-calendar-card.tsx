import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  isConnected: boolean;
  googleEmail: string | null;
  status: { kind: "connected" | "disconnected" | "error"; message: string } | null;
  configured: boolean;
}

export function GoogleCalendarCard({
  isConnected,
  googleEmail,
  status,
  configured,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Mirror case events you create in this CRM onto your Google Calendar.
          Sync only goes one way for now: the CRM remains the source of truth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            Google Calendar is not configured for this deployment. Set the
            GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI and
            GOOGLE_CALENDAR_SCOPES environment variables and redeploy.
          </p>
        )}

        {status && (
          <p
            className={
              status.kind === "error"
                ? "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400"
                : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            }
          >
            {status.message}
          </p>
        )}

        {isConnected ? (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Connected{googleEmail ? ` as ${googleEmail}` : ""}
              </span>
            </div>
            <form action="/api/google/calendar/disconnect" method="POST">
              <Button type="submit" variant="outline" disabled={!configured}>
                Disconnect
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-muted-foreground">
                Not connected
              </span>
            </div>
            <Button asChild disabled={!configured}>
              <a href="/api/google/calendar/connect">Connect Google Calendar</a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
