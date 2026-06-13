"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";

const BUCKET = "case-documents";

export interface MutationResult {
  error?: string;
}

const orNull = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function getOwnedCase(caseId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("id, client_id")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

async function getOwnedFolder(folderId: string, caseId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_folders")
    .select("id")
    .eq("id", folderId)
    .eq("case_id", caseId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

function revalidateDocumentViews(caseId?: string | null) {
  revalidatePath("/documents");
  if (caseId) revalidatePath(`/cases/${caseId}`);
}

export async function createFolder(formData: FormData): Promise<MutationResult> {
  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const caseId = orNull(formData.get("caseId"));
  const name = orNull(formData.get("name"));
  const parentFolderId = orNull(formData.get("parentFolderId"));

  if (!caseId) return { error: "Choose a case for this folder." };
  if (!name) return { error: "Folder name is required." };

  const caseRow = await getOwnedCase(caseId, user.id);
  if (!caseRow) return { error: "Case not found." };

  if (parentFolderId) {
    const parent = await getOwnedFolder(parentFolderId, caseId, user.id);
    if (!parent) return { error: "Parent folder not found." };
  }

  const folder: TablesInsert<"document_folders"> = {
    user_id: user.id,
    case_id: caseId,
    parent_folder_id: parentFolderId,
    name,
  };

  const { error } = await supabase.from("document_folders").insert(folder);
  if (error) return { error: `Could not create folder: ${error.message}` };

  revalidateDocumentViews(caseId);
  return {};
}

export async function renameFolder(formData: FormData): Promise<MutationResult> {
  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const folderId = orNull(formData.get("folderId"));
  const name = orNull(formData.get("name"));
  if (!folderId) return { error: "Choose a folder to rename." };
  if (!name) return { error: "Folder name is required." };

  const { data: folder } = await supabase
    .from("document_folders")
    .select("id, case_id")
    .eq("id", folderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!folder) return { error: "Folder not found." };

  const update: TablesUpdate<"document_folders"> = { name };
  const { error } = await supabase
    .from("document_folders")
    .update(update)
    .eq("id", folderId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not rename folder: ${error.message}` };

  revalidateDocumentViews(folder.case_id);
  return {};
}

export async function uploadDocument(
  formData: FormData
): Promise<MutationResult> {
  const { supabase, user } = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const caseId = orNull(formData.get("caseId"));
  const folderId = orNull(formData.get("folderId"));
  const file = formData.get("file") as File | null;
  const documentType = orNull(formData.get("documentType"));

  if (!caseId) return { error: "Choose a case for this document." };
  if (!file || file.size === 0) return { error: "Please choose a file." };

  const caseRow = await getOwnedCase(caseId, user.id);
  if (!caseRow) return { error: "Case not found." };

  if (folderId) {
    const folder = await getOwnedFolder(folderId, caseId, user.id);
    if (!folder) return { error: "Folder not found for this case." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folderSegment = folderId ? `${folderId}/` : "root/";
  const path = `${user.id}/${caseId}/${folderSegment}${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) {
    return {
      error: `Upload failed: ${uploadError.message}. Make sure the "${BUCKET}" bucket exists and rerun supabase/storage/case-documents-policies.sql if this mentions row-level security.`,
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: user.id,
    case_id: caseId,
    client_id: caseRow.client_id,
    folder_id: folderId,
    file_name: file.name,
    file_url: null,
    file_path: path,
    file_type: file.type || null,
    document_type: documentType,
  });
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: `Could not save document: ${insertError.message}` };
  }

  revalidateDocumentViews(caseId);
  return {};
}

export async function deleteDocument(
  documentId: string
): Promise<MutationResult> {
  const { supabase, user } = await getCurrentUser();
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

  revalidateDocumentViews(doc.case_id);
  return {};
}
