"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export interface MutationResult {
  error?: string;
}

export interface CreateClientResult {
  clientId?: string;
  error?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export interface CreateClientPayload {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  notes: string;
  caseId: string;
}

// Creates a client on its own. Optionally links the new client to an existing
// case (assigns that case's client_id), which is how you add a client to a
// matter you created without one.
export async function createClientRecord(
  payload: CreateClientPayload
): Promise<CreateClientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.fullName.trim()) return { error: "Client name is required." };

  // If linking to a case, confirm it belongs to the user first.
  const caseId = payload.caseId || null;
  if (caseId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!caseRow) return { error: "Selected case not found." };
  }

  const insert: TablesInsert<"clients"> = {
    user_id: user.id,
    full_name: payload.fullName.trim(),
    email: orNull(payload.email),
    phone: orNull(payload.phone),
    address: orNull(payload.address),
    source: orNull(payload.source),
    status: "active",
    notes: orNull(payload.notes),
  };

  const { data: client, error } = await supabase
    .from("clients")
    .insert(insert)
    .select("id")
    .single();

  if (error || !client) {
    return { error: `Could not create client: ${error?.message}` };
  }

  if (caseId) {
    const { error: linkError } = await supabase
      .from("cases")
      .update({ client_id: client.id })
      .eq("id", caseId)
      .eq("user_id", user.id);
    if (linkError) {
      return {
        clientId: client.id,
        error: `Client created, but could not link the case: ${linkError.message}`,
      };
    }
    revalidatePath(`/cases/${caseId}`);
  }

  revalidatePath("/", "layout");
  return { clientId: client.id };
}

// Deletes a client only. Cases and other records that referenced the client
// keep existing — their client_id foreign keys are ON DELETE SET NULL, so they
// simply become unassigned. Cases are deleted separately from a case page.
export async function deleteClient(clientId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete client: ${error.message}` };

  revalidatePath("/", "layout");
  return {};
}

export interface UpdateClientPayload {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  status: string;
  notes: string;
}

export async function updateClient(
  clientId: string,
  payload: UpdateClientPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.fullName.trim()) return { error: "Client name is required." };

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: payload.fullName.trim(),
      email: orNull(payload.email),
      phone: orNull(payload.phone),
      address: orNull(payload.address),
      source: orNull(payload.source),
      status: payload.status || "active",
      notes: orNull(payload.notes),
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not save changes: ${error.message}` };

  revalidatePath("/", "layout");
  return {};
}
