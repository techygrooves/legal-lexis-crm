import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DocumentsView, type DocumentListItem } from "./documents-view";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: documents, error }, { data: cases }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_name, file_type, case_id, file_path, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("cases").select("id, title").eq("user_id", user.id),
  ]);

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  const caseTitles = new Map((cases ?? []).map((c) => [c.id, c.title]));

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
        caseTitle: doc.case_id ? (caseTitles.get(doc.case_id) ?? "") : "",
        uploadedAt: doc.uploaded_at,
        signedUrl,
      };
    })
  );

  return <DocumentsView documents={items} />;
}
