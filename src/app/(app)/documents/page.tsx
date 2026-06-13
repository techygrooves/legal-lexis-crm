import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  DocumentsView,
  type CaseOption,
  type DocumentFolder,
  type DocumentListItem,
} from "./documents-view";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: documents, error },
    { data: cases },
    { data: folders },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_name, file_type, case_id, folder_id, file_path, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("cases")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_folders")
      .select("id, name, case_id, parent_folder_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  const caseTitles = new Map((cases ?? []).map((c) => [c.id, c.title]));
  const folderNames = new Map((folders ?? []).map((f) => [f.id, f.name]));

  const items: DocumentListItem[] = await Promise.all(
    (documents ?? []).map(async (doc) => {
      let signedUrl: string | null = null;
      if (doc.file_path) {
        const { data: signed } = await supabase.storage
          .from("case-documents")
          .createSignedUrl(doc.file_path, 60 * 60);
        signedUrl = signed?.signedUrl ?? null;
      }
      return {
        id: doc.id,
        fileName: doc.file_name,
        fileType: doc.file_type,
        caseId: doc.case_id,
        caseTitle: caseTitles.get(doc.case_id) ?? "",
        folderId: doc.folder_id,
        folderName: doc.folder_id ? (folderNames.get(doc.folder_id) ?? "") : "Case root",
        uploadedAt: doc.uploaded_at,
        signedUrl,
      };
    })
  );

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  const folderOptions: DocumentFolder[] = (folders ?? []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    caseId: folder.case_id,
    parentFolderId: folder.parent_folder_id,
  }));

  return (
    <DocumentsView
      documents={items}
      cases={caseOptions}
      folders={folderOptions}
    />
  );
}
