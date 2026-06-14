"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export interface MutationResult {
  error?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export interface ContactPayload {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  caseId: string;
}

async function resolveCase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
  userId: string
): Promise<{ caseId: string | null } | { error: string }> {
  if (!caseId) return { caseId: null };
  const { data } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { error: "Selected case not found." };
  return { caseId: data.id };
}

export async function createContact(
  payload: ContactPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!payload.name.trim()) return { error: "Contact name is required." };

  const resolved = await resolveCase(supabase, payload.caseId, user.id);
  if ("error" in resolved) return { error: resolved.error };

  const insert: TablesInsert<"contacts"> = {
    user_id: user.id,
    case_id: resolved.caseId,
    name: payload.name.trim(),
    role: orNull(payload.role),
    email: orNull(payload.email),
    phone: orNull(payload.phone),
    notes: orNull(payload.notes),
  };

  const { error } = await supabase.from("contacts").insert(insert);
  if (error) return { error: `Could not create contact: ${error.message}` };

  revalidatePath("/contacts");
  return {};
}

export async function updateContact(
  contactId: string,
  payload: ContactPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (!payload.name.trim()) return { error: "Contact name is required." };

  const resolved = await resolveCase(supabase, payload.caseId, user.id);
  if ("error" in resolved) return { error: resolved.error };

  const { error } = await supabase
    .from("contacts")
    .update({
      case_id: resolved.caseId,
      name: payload.name.trim(),
      role: orNull(payload.role),
      email: orNull(payload.email),
      phone: orNull(payload.phone),
      notes: orNull(payload.notes),
    })
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not update contact: ${error.message}` };

  revalidatePath("/contacts");
  if (resolved.caseId) revalidatePath(`/cases/${resolved.caseId}`);
  return {};
}

export async function deleteContact(
  contactId: string
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete contact: ${error.message}` };

  revalidatePath("/contacts");
  return {};
}
