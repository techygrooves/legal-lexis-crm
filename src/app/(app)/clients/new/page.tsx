import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AddClientForm, type CaseOption } from "./add-client-form";

export default async function NewClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return <AddClientForm cases={caseOptions} />;
}
