"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface MutationResult {
  error?: string;
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
