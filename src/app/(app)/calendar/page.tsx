import { redirect } from "next/navigation";
import { format } from "date-fns";

import type { CalendarEvent, EventType } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { CalendarView, type CaseOption } from "./calendar-view";

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

  const [{ data: events, error }, { data: cases }] = await Promise.all([
    supabase
      .from("case_events")
      .select("id, title, event_type, event_date, start_time, end_time, location")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("cases")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(`Failed to load calendar: ${error.message}`);
  }

  const calendarEvents: CalendarEvent[] = (events ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    date: row.event_date,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    type: toEventType(row.event_type),
    location: row.location ?? undefined,
  }));

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  const today = format(new Date(), "yyyy-MM-dd");
  const initialMonth = `${today.slice(0, 7)}-01`;

  return (
    <CalendarView
      events={calendarEvents}
      cases={caseOptions}
      initialMonth={initialMonth}
      today={today}
    />
  );
}
