"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  deleteEvent as deleteGoogleEvent,
  pushEvent,
} from "@/lib/google-calendar";
import type { TablesInsert } from "@/lib/types/database";

export interface MutationResult {
  error?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export interface CreateEventPayload {
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  caseId: string;
}

export async function createEvent(
  payload: CreateEventPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.title.trim()) return { error: "Event title is required." };
  if (!payload.eventDate) return { error: "Event date is required." };

  let clientId: string | null = null;
  const caseId = payload.caseId || null;
  if (caseId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!caseRow) return { error: "Selected case not found." };
    clientId = caseRow.client_id;
  }

  const insert: TablesInsert<"case_events"> = {
    user_id: user.id,
    case_id: caseId,
    client_id: clientId,
    title: payload.title.trim(),
    event_type: payload.eventType || "meeting",
    event_date: payload.eventDate,
    start_time: orNull(payload.startTime),
    end_time: orNull(payload.endTime),
    location: orNull(payload.location),
    notes: null,
  };

  const { data: inserted, error } = await supabase
    .from("case_events")
    .insert(insert)
    .select("*")
    .single();
  if (error || !inserted) {
    return { error: `Could not create event: ${error?.message}` };
  }

  // Mirror to Google Calendar if the user is connected. Failures here are
  // logged inside pushEvent and do not surface — the CRM event still saved.
  const googleEventId = await pushEvent(supabase, user.id, inserted);
  if (googleEventId) {
    await supabase
      .from("case_events")
      .update({ google_event_id: googleEventId })
      .eq("id", inserted.id);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}

export interface UpdateEventPayload {
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  caseId: string;
}

export async function updateEvent(
  eventId: string,
  payload: UpdateEventPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.title.trim()) return { error: "Event title is required." };
  if (!payload.eventDate) return { error: "Event date is required." };

  let clientId: string | null = null;
  const caseId = payload.caseId || null;
  if (caseId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!caseRow) return { error: "Selected case not found." };
    clientId = caseRow.client_id;
  }

  const { data: updated, error } = await supabase
    .from("case_events")
    .update({
      case_id: caseId,
      client_id: clientId,
      title: payload.title.trim(),
      event_type: payload.eventType || "meeting",
      event_date: payload.eventDate,
      start_time: orNull(payload.startTime),
      end_time: orNull(payload.endTime),
      location: orNull(payload.location),
    })
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error || !updated) {
    return { error: `Could not save changes: ${error?.message}` };
  }

  // Mirror the edit to Google Calendar. pushEvent patches the existing event
  // when google_event_id is set, or inserts one if the user connected after
  // the event was first created. Failures are swallowed inside pushEvent.
  const googleEventId = await pushEvent(supabase, user.id, updated);
  if (googleEventId && googleEventId !== updated.google_event_id) {
    await supabase
      .from("case_events")
      .update({ google_event_id: googleEventId })
      .eq("id", updated.id);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}

export async function deleteEvent(eventId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: row } = await supabase
    .from("case_events")
    .select("google_event_id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Remove the mirrored Google event first (best-effort). If this fails the
  // CRM delete still proceeds — a stray Google event is better than a row that
  // won't delete.
  if (row?.google_event_id) {
    await deleteGoogleEvent(supabase, user.id, row.google_event_id);
  }

  const { error } = await supabase
    .from("case_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);
  if (error) return { error: `Could not delete event: ${error.message}` };

  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}
