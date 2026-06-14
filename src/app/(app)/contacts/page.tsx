import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ContactsView, type CaseOption, type ContactItem } from "./contacts-view";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contacts, error }, { data: cases }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, role, email, phone, notes, case_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cases")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(`Failed to load contacts: ${error.message}`);
  }

  const caseTitles = new Map((cases ?? []).map((c) => [c.id, c.title]));

  const items: ContactItem[] = (contacts ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    notes: row.notes ?? "",
    caseId: row.case_id,
    caseTitle: row.case_id ? (caseTitles.get(row.case_id) ?? "") : "",
  }));

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return <ContactsView contacts={items} cases={caseOptions} />;
}
