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

export async function uploadDocument(
  formData: FormData
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const caseId = formData.get("caseId") as string;
  const file = formData.get("file") as File | null;
  const documentType = (formData.get("documentType") as string) || null;

  if (!file || file.size === 0) return { error: "Please choose a file." };

  // Confirm the case belongs to the user and grab its client for linkage.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, client_id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!caseRow) return { error: "Case not found." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${caseId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) {
    return {
      error: `Upload failed: ${uploadError.message}. Make sure the "${BUCKET}" bucket and its storage policies exist (see README).`,
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    case_id: caseId,
    client_id: caseRow.client_id,
    file_name: file.name,
    file_url: null,
    file_path: path,
    file_type: file.type || null,
    document_type: documentType,
  });
  if (insertError) {
    // Roll back the uploaded object so we don't orphan it.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: `Could not save document: ${insertError.message}` };
  }

  revalidatePath(`/cases/${caseId}`);
  return {};
}

export async function deleteDocument(
  documentId: string
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: doc } = await supabase
    .from("documents")
    .select("id, case_id, file_path")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  if (doc.file_path) {
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);
  if (error) return { error: `Could not delete document: ${error.message}` };

  if (doc.case_id) revalidatePath(`/cases/${doc.case_id}`);
  return {};
}
