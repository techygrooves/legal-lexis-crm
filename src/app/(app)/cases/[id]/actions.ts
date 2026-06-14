"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/types/database";

const BUCKET = "case-documents";

export interface MutationResult {
  error?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export interface UpdateCasePayload {
  title: string;
  practiceArea: string;
  caseNumber: string;
  courtName: string;
  courtNumber: string;
  judgeName: string;
  opposingParty: string;
  opposingAttorney: string;
  stateAttorney: string;
  stateAttorneyPhone: string;
  charge: string;
  insuranceCompany: string;
  insuranceAgentPhone: string;
  status: string;
  filedDate: string;
  description: string;
}

export async function updateCase(
  caseId: string,
  payload: UpdateCasePayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.title.trim()) return { error: "Case title is required." };

  const update: TablesUpdate<"cases"> = {
    title: payload.title.trim(),
    practice_area: orNull(payload.practiceArea),
    case_number: orNull(payload.caseNumber),
    court_name: orNull(payload.courtName),
    court_number: orNull(payload.courtNumber),
    judge_name: orNull(payload.judgeName),
    opposing_party: orNull(payload.opposingParty),
    opposing_attorney: orNull(payload.opposingAttorney),
    state_attorney: orNull(payload.stateAttorney),
    state_attorney_phone: orNull(payload.stateAttorneyPhone),
    charge: orNull(payload.charge),
    insurance_company: orNull(payload.insuranceCompany),
    insurance_agent_phone: orNull(payload.insuranceAgentPhone),
    status: payload.status || "open",
    filed_date: orNull(payload.filedDate),
    description: orNull(payload.description),
  };

  const { error } = await supabase
    .from("cases")
    .update(update)
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not update case: ${error.message}` };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return {};
}

export async function deleteCase(caseId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Confirm ownership before deleting.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!caseRow) return { error: "Case not found." };

  // Remove this case's stored files first (table rows cascade on delete, but
  // storage objects do not).
  const { data: docs } = await supabase
    .from("documents")
    .select("file_path")
    .eq("case_id", caseId)
    .eq("user_id", user.id);
  const paths = (docs ?? [])
    .map((d) => d.file_path)
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete case: ${error.message}` };

  revalidatePath("/", "layout");
  return {};
}

