"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
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

  const { error } = await supabase.from("case_events").insert(insert);
  if (error) return { error: `Could not create event: ${error.message}` };

  revalidatePath("/calendar");
  revalidatePath("/");
  return {};
}
