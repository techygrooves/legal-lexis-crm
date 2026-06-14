import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CasesList, type CaseListItem } from "./cases-list";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string }>;
}) {
  const { status, area } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cases, error }, { data: clients }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, title, client_id, practice_area, case_number, court_name, judge_name, filed_date, status"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, full_name").eq("user_id", user.id),
  ]);

  if (error) {
    throw new Error(`Failed to load cases: ${error.message}`);
  }

  const clientNames = new Map(
    (clients ?? []).map((client) => [client.id, client.full_name])
  );

  const items: CaseListItem[] = (cases ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    clientName: row.client_id ? (clientNames.get(row.client_id) ?? "") : "",
    practiceArea: row.practice_area ?? "",
    caseNumber: row.case_number ?? "",
    courtName: row.court_name ?? "",
    judgeName: row.judge_name ?? "",
    filedDate: row.filed_date,
    status: row.status,
  }));

  const validStatus =
    status && ["open", "pending", "closed"].includes(status) ? status : "all";

  return <CasesList cases={items} initialStatus={validStatus} area={area ?? ""} />;
}
