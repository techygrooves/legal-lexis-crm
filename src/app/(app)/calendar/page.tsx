import { redirect } from "next/navigation";
import { format } from "date-fns";

import { listEvents } from "@/lib/google-calendar";
import type { CalendarEvent, EventType } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarView,
  type CaseOption,
  type EditableEvent,
} from "./calendar-view";

function toEventType(dbType: string): EventType {
  const cap = dbType.charAt(0).toUpperCase() + dbType.slice(1).toLowerCase();
  if (
    cap === "Hearing" ||
    cap === "Meeting" ||
    cap === "Deadline" ||
    cap === "Conference"
  ) {
    return cap;
  }
  return "Meeting";
}

function formatTime(time: string | null) {
  if (!time) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: events, error }, { data: cases }, { data: clients }] =
    await Promise.all([
      supabase
        .from("case_events")
        .select(
          "id, title, event_type, event_date, start_time, end_time, location, case_id, client_id, google_event_id"
        )
        .eq("user_id", user.id)
        .order("event_date", { ascending: true }),
      supabase
        .from("cases")
        .select("id, title, case_number, client_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, full_name")
        .eq("user_id", user.id),
    ]);

  if (error) {
    throw new Error(`Failed to load calendar: ${error.message}`);
  }

  const caseById = new Map((cases ?? []).map((c) => [c.id, c]));
  const clientNameById = new Map(
    (clients ?? []).map((c) => [c.id, c.full_name])
  );

  const calendarEvents: CalendarEvent[] = (events ?? []).map((row) => {
    const caseRow = row.case_id ? caseById.get(row.case_id) : undefined;
    // Prefer the event's own client_id, falling back to the case's client.
    const clientId = row.client_id ?? caseRow?.client_id ?? null;
    return {
      id: row.id,
      title: row.title,
      date: row.event_date,
      startTime: formatTime(row.start_time),
      endTime: formatTime(row.end_time),
      type: toEventType(row.event_type),
      location: row.location ?? undefined,
      caseId: row.case_id,
      caseNumber: caseRow?.case_number ?? undefined,
      clientName: clientId
        ? clientNameById.get(clientId) ?? undefined
        : undefined,
    };
  });

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  // Raw values (HH:MM times, lowercase type, empty strings instead of null) so
  // the edit dialog can pre-fill its form fields directly.
  const editableEvents: EditableEvent[] = (events ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    eventDate: row.event_date,
    startTime: row.start_time ? row.start_time.slice(0, 5) : "",
    endTime: row.end_time ? row.end_time.slice(0, 5) : "",
    location: row.location ?? "",
    caseId: row.case_id ?? "",
  }));

  // Read-only overlay of the user's own Google Calendar events. Sync remains
  // one-way at the data level (Supabase is the source of truth); Google events
  // are displayed but not stored, and clicking one opens it in Google.
  const now = new Date();
  const sixtyDays = 60 * 24 * 60 * 60 * 1000;
  const googleEvents = await listEvents(
    supabase,
    user.id,
    new Date(now.getTime() - sixtyDays),
    new Date(now.getTime() + sixtyDays)
  );
  // Don't show CRM-pushed events twice — every case_event row with a
  // google_event_id is the same event Google would return for it.
  const mirroredGoogleIds = new Set(
    (events ?? [])
      .map((row) => row.google_event_id)
      .filter((id): id is string => Boolean(id))
  );
  for (const event of googleEvents) {
    if (mirroredGoogleIds.has(event.id)) continue;
    calendarEvents.push({
      id: `google:${event.id}`,
      title: event.title,
      date: event.date,
      startTime: event.startTime
        ? formatTime(event.startTime) ?? event.startTime
        : undefined,
      endTime: event.endTime
        ? formatTime(event.endTime) ?? event.endTime
        : undefined,
      // Google events aren't typed in the CRM's color scheme; mark them as
      // Meeting so the type union stays valid, but the renderer keys off
      // `source` for styling, not `type`.
      type: "Meeting",
      location: event.location,
      caseId: null,
      source: "google",
      htmlLink: event.htmlLink,
    });
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const initialMonth = `${today.slice(0, 7)}-01`;

  return (
    <CalendarView
      events={calendarEvents}
      editableEvents={editableEvents}
      cases={caseOptions}
      initialMonth={initialMonth}
      today={today}
    />
  );
}
