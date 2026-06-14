import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EditCaseForm } from "./edit-case-form";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caseRow } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!caseRow) notFound();

  return (
    <EditCaseForm
      caseId={caseRow.id}
      initial={{
        title: caseRow.title,
        practiceArea: caseRow.practice_area ?? "",
        caseNumber: caseRow.case_number ?? "",
        courtName: caseRow.court_name ?? "",
        courtNumber: caseRow.court_number ?? "",
        judgeName: caseRow.judge_name ?? "",
        opposingParty: caseRow.opposing_party ?? "",
        opposingAttorney: caseRow.opposing_attorney ?? "",
        stateAttorney: caseRow.state_attorney ?? "",
        stateAttorneyPhone: caseRow.state_attorney_phone ?? "",
        charge: caseRow.charge ?? "",
        insuranceCompany: caseRow.insurance_company ?? "",
        insuranceAgentPhone: caseRow.insurance_agent_phone ?? "",
        status: caseRow.status,
        filedDate: caseRow.filed_date ?? "",
        description: caseRow.description ?? "",
      }}
    />
  );
}
