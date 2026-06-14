import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { NotesView, type CaseOption, type NoteItem } from "./notes-view";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: notes, error }, { data: cases }] = await Promise.all([
    supabase
      .from("notes")
      .select("id, note, case_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cases")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(`Failed to load notes: ${error.message}`);
  }

  const caseTitles = new Map((cases ?? []).map((c) => [c.id, c.title]));

  const items: NoteItem[] = (notes ?? []).map((row) => ({
    id: row.id,
    note: row.note,
    caseId: row.case_id,
    caseTitle: row.case_id ? (caseTitles.get(row.case_id) ?? "") : "",
    createdAt: row.created_at,
  }));

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return <NotesView notes={items} cases={caseOptions} />;
}
