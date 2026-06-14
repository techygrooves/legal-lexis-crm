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
      .select("id, full_name, email, phone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cases")
      .select("id, client_id, status")
      .eq("user_id", user.id),
  ]);

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }

  const caseCounts = new Map<string, number>();
  const hasActiveCase = new Map<string, boolean>();
  for (const caseRow of cases ?? []) {
    if (!caseRow.client_id) continue;
    caseCounts.set(
      caseRow.client_id,
      (caseCounts.get(caseRow.client_id) ?? 0) + 1
    );
    if (caseRow.status === "open" || caseRow.status === "pending") {
      hasActiveCase.set(caseRow.client_id, true);
    }
  }

  // Derive a meaningful client status from their matters rather than a static
  // stored value: Active = has an open/pending case, Closed = has cases but all
  // closed, Prospect = no cases yet.
  const deriveStatus = (id: string) => {
    if (hasActiveCase.get(id)) return "Active";
    if ((caseCounts.get(id) ?? 0) > 0) return "Closed";
    return "Prospect";
  };

  const items: ClientListItem[] = (clients ?? []).map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: deriveStatus(row.id),
    caseCount: caseCounts.get(row.id) ?? 0,
  }));

  return <ClientsList clients={items} />;
}
