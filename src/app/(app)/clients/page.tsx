import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ClientsList, type ClientListItem } from "./clients-list";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: clients, error }, { data: cases }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, email, phone, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("cases").select("id, client_id").eq("user_id", user.id),
  ]);

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }

  const caseCounts = new Map<string, number>();
  for (const caseRow of cases ?? []) {
    if (caseRow.client_id) {
      caseCounts.set(
        caseRow.client_id,
        (caseCounts.get(caseRow.client_id) ?? 0) + 1
      );
    }
  }

  const items: ClientListItem[] = (clients ?? []).map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status,
    caseCount: caseCounts.get(row.id) ?? 0,
  }));

  return <ClientsList clients={items} />;
}
