import { redirect } from "next/navigation";
import { format } from "date-fns";

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

  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: cases, error }, { data: clients }, { data: upcoming }] =
    await Promise.all([
      supabase
        .from("cases")
        .select(
          "id, title, client_id, practice_area, case_number, court_name, judge_name, filed_date, status"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name").eq("user_id", user.id),
      supabase
        .from("case_events")
        .select("case_id, event_date, start_time")
        .eq("user_id", user.id)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: false }),
    ]);

  if (error) {
    throw new Error(`Failed to load cases: ${error.message}`);
  }

  const clientNames = new Map(
    (clients ?? []).map((client) => [client.id, client.full_name])
  );

  // The query is ordered soonest-first, so the first row seen for a case is its
  // next upcoming event date — keep only that one per case.
  const nextHearingByCase = new Map<string, string>();
  for (const event of upcoming ?? []) {
    if (event.case_id && !nextHearingByCase.has(event.case_id)) {
      nextHearingByCase.set(event.case_id, event.event_date);
    }
  }

  const items: CaseListItem[] = (cases ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    clientName: row.client_id ? (clientNames.get(row.client_id) ?? "") : "",
    practiceArea: row.practice_area ?? "",
    caseNumber: row.case_number ?? "",
    courtName: row.court_name ?? "",
    judgeName: row.judge_name ?? "",
    nextHearingDate: nextHearingByCase.get(row.id) ?? null,
    status: row.status,
    hasUpcomingEvent: nextHearingByCase.has(row.id),
  }));

  const validStatus =
    status && ["open", "pending", "closed"].includes(status) ? status : "all";

  return <CasesList cases={items} initialStatus={validStatus} area={area ?? ""} />;
}
