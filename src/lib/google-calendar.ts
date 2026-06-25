// Google Calendar sync helpers.
// One-way: CRM case_events -> Google. Supabase remains the source of truth;
// failures here must not block the underlying DB write — callers wrap each
// call in try/catch and log warnings instead of failing the user action.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CaseEventRow, Database } from "@/lib/types/database";

const DEFAULT_SCOPES = "https://www.googleapis.com/auth/calendar.events";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const FALLBACK_TIMEZONE = "America/New_York";

export function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

export function getScopes() {
  return (process.env.GOOGLE_CALENDAR_SCOPES ?? DEFAULT_SCOPES).trim();
}

export function buildAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: getScopes(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Decode the email claim from an id_token without verifying the signature.
// Used purely as a display label ("Connected as you@example.com"); we don't
// trust it for authorization.
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    return typeof payload?.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

// Fetch the primary calendar's timezone so events with start_time land in the
// right local time. Failures fall back to America/New_York.
export async function fetchPrimaryTimezone(accessToken: string): Promise<string> {
  const res = await fetch(`${CALENDAR_BASE}/calendars/primary`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return FALLBACK_TIMEZONE;
  const data = (await res.json()) as { timeZone?: string };
  return data.timeZone || FALLBACK_TIMEZONE;
}

type SupabaseAny = SupabaseClient<Database>;

interface ValidToken {
  accessToken: string;
  calendarId: string;
  timezone: string;
}

// Returns a fresh access token, refreshing via the stored refresh_token if the
// current one is missing or expired. Returns null if the user hasn't connected
// Google Calendar — callers should treat this as a no-op (CRM still saves).
export async function getValidAccessToken(
  supabase: SupabaseAny,
  userId: string
): Promise<ValidToken | null> {
  const { data: row } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token, access_token, expires_at, calendar_id, calendar_timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) return null;

  const now = Date.now();
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  // Refresh a minute early to avoid races with Google's clock.
  const stillValid = row.access_token && expiresAt - 60_000 > now;

  if (stillValid) {
    return {
      accessToken: row.access_token!,
      calendarId: row.calendar_id || "primary",
      timezone: row.calendar_timezone || FALLBACK_TIMEZONE,
    };
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  const newExpiry = new Date(now + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("google_calendar_tokens")
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiry,
    })
    .eq("user_id", userId);

  return {
    accessToken: refreshed.access_token,
    calendarId: row.calendar_id || "primary",
    timezone: row.calendar_timezone || FALLBACK_TIMEZONE,
  };
}

// Build the Google event body from a Supabase case_events row.
// - Has start_time: timed event in the calendar's timezone.
// - No start_time: all-day event (end date is exclusive per RFC 5545).
function buildEventBody(event: CaseEventRow, timezone: string) {
  const description = [
    event.event_type ? `Type: ${event.event_type}` : null,
    event.notes,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!event.start_time) {
    const start = new Date(`${event.event_date}T00:00:00Z`);
    const endDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return {
      summary: event.title,
      description,
      location: event.location ?? undefined,
      start: { date: event.event_date },
      end: { date: endDay.toISOString().slice(0, 10) },
    };
  }

  // Google accepts HH:MM:SS; the time column is `time without time zone` so a
  // trailing :00 may be missing.
  const startTime = event.start_time.length === 5 ? `${event.start_time}:00` : event.start_time;
  const endTime = event.end_time
    ? event.end_time.length === 5
      ? `${event.end_time}:00`
      : event.end_time
    : null;

  // Default to a 1-hour block when no end_time is set.
  const startIso = `${event.event_date}T${startTime}`;
  const endIso = endTime
    ? `${event.event_date}T${endTime}`
    : new Date(new Date(`${startIso}Z`).getTime() + 60 * 60 * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, "");

  return {
    summary: event.title,
    description,
    location: event.location ?? undefined,
    start: { dateTime: startIso, timeZone: timezone },
    end: { dateTime: endIso, timeZone: timezone },
  };
}

// Insert (or update, if googleEventId already exists) the event on Google.
// Returns the google event id on success, or null on failure (logged).
export async function pushEvent(
  supabase: SupabaseAny,
  userId: string,
  event: CaseEventRow
): Promise<string | null> {
  try {
    const token = await getValidAccessToken(supabase, userId);
    if (!token) return null;

    const body = buildEventBody(event, token.timezone);
    const isUpdate = Boolean(event.google_event_id);
    const url = isUpdate
      ? `${CALENDAR_BASE}/calendars/${encodeURIComponent(token.calendarId)}/events/${encodeURIComponent(event.google_event_id!)}`
      : `${CALENDAR_BASE}/calendars/${encodeURIComponent(token.calendarId)}/events`;

    const res = await fetch(url, {
      method: isUpdate ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(
        `Google Calendar push failed (${res.status}): ${await res.text()}`
      );
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (err) {
    console.warn("Google Calendar push errored:", err);
    return null;
  }
}

export async function deleteEvent(
  supabase: SupabaseAny,
  userId: string,
  googleEventId: string
): Promise<boolean> {
  try {
    const token = await getValidAccessToken(supabase, userId);
    if (!token) return false;
    const res = await fetch(
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(token.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token.accessToken}` },
      }
    );
    // 410 Gone is fine: already removed.
    return res.ok || res.status === 410;
  } catch (err) {
    console.warn("Google Calendar delete errored:", err);
    return false;
  }
}

// Best-effort revoke. Failure here is not user-facing; the local row is the
// authoritative connect/disconnect signal.
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
  } catch {
    // ignored
  }
}

export interface GoogleListedEvent {
  id: string;
  title: string;
  htmlLink: string;
  // yyyy-MM-dd in the calendar's timezone.
  date: string;
  // HH:MM in the calendar's timezone, or undefined for all-day events.
  startTime?: string;
  endTime?: string;
  location?: string;
}

interface GoogleEventResource {
  id?: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
}

// Format a UTC Date into yyyy-MM-dd / HH:MM strings as observed from the given
// IANA timezone. Uses Intl.DateTimeFormat parts to avoid pulling in a tz lib.
function partsInTimeZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  // Intl renders midnight as 24:00 in some locales — normalize.
  const hour = parts.hour === "24" ? "00" : parts.hour;
  const time = `${hour}:${parts.minute}`;
  return { date: dateStr, time };
}

// Lists upcoming events from the user's primary Google Calendar in a window.
// Returns [] when the user isn't connected or Google errors — callers treat
// the absence the same as "no Google events to show".
export async function listEvents(
  supabase: SupabaseAny,
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<GoogleListedEvent[]> {
  try {
    const token = await getValidAccessToken(supabase, userId);
    if (!token) return [];

    const params = new URLSearchParams({
      timeMin: rangeStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      // Show events in the calendar's local timezone so the wall-clock matches
      // what the user sees in Google Calendar.
      timeZone: token.timezone,
    });
    const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(token.calendarId)}/events?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });
    if (!res.ok) {
      console.warn(
        `Google Calendar list failed (${res.status}): ${await res.text()}`
      );
      return [];
    }
    const data = (await res.json()) as { items?: GoogleEventResource[] };

    return (data.items ?? [])
      .filter((item) => item.id && item.status !== "cancelled")
      .map((item) => {
        const isAllDay = Boolean(item.start?.date);
        let date = "";
        let startTime: string | undefined;
        let endTime: string | undefined;

        if (isAllDay) {
          date = item.start!.date!;
        } else if (item.start?.dateTime) {
          const start = partsInTimeZone(
            new Date(item.start.dateTime),
            token.timezone
          );
          date = start.date;
          startTime = start.time;
          if (item.end?.dateTime) {
            const end = partsInTimeZone(
              new Date(item.end.dateTime),
              token.timezone
            );
            endTime = end.time;
          }
        }

        return {
          id: item.id!,
          title: item.summary?.trim() || "(no title)",
          htmlLink: item.htmlLink ?? "",
          date,
          startTime,
          endTime,
          location: item.location?.trim() || undefined,
        };
      })
      .filter((event) => event.date);
  } catch (err) {
    console.warn("Google Calendar list errored:", err);
    return [];
  }
}
