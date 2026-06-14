"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export interface MutationResult {
  error?: string;
}

export interface NotePayload {
  note: string;
  caseId: string;
}

async function resolveCase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
  userId: string
): Promise<{ caseId: string | null; clientId: string | null } | { error: string }> {
  if (!caseId) return { caseId: null, clientId: null };
  const { data } = await supabase
    .from("cases")
    .select("id, client_id")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { error: "Selected case not found." };
  return { caseId: data.id, clientId: data.client_id };
}

export async function createNote(
  payload: NotePayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!payload.note.trim()) return { error: "Note text is required." };

  const resolved = await resolveCase(supabase, payload.caseId, user.id);
  if ("error" in resolved) return { error: resolved.error };

  const insert: TablesInsert<"notes"> = {
    user_id: user.id,
    case_id: resolved.caseId,
    client_id: resolved.clientId,
    note: payload.note.trim(),
  };

  const { error } = await supabase.from("notes").insert(insert);
  if (error) return { error: `Could not create note: ${error.message}` };

  revalidatePath("/notes");
  if (resolved.caseId) revalidatePath(`/cases/${resolved.caseId}`);
  return {};
}

export async function updateNote(
  noteId: string,
  payload: NotePayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!payload.note.trim()) return { error: "Note text is required." };

  const resolved = await resolveCase(supabase, payload.caseId, user.id);
  if ("error" in resolved) return { error: resolved.error };

  const { error } = await supabase
    .from("notes")
    .update({
      note: payload.note.trim(),
      case_id: resolved.caseId,
      client_id: resolved.clientId,
    })
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not update note: ${error.message}` };

  revalidatePath("/notes");
  if (resolved.caseId) revalidatePath(`/cases/${resolved.caseId}`);
  return {};
}

export async function deleteNote(noteId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete note: ${error.message}` };

  revalidatePath("/notes");
  return {};
}
