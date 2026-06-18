import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AddCaseForm } from "./add-case-form";

export default async function AddCasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone")
    .eq("user_id", user.id)
    .order("full_name", { ascending: true });

  return (
    <AddCaseForm
      existingClients={(clients ?? []).map((client) => ({
        id: client.id,
        name: client.full_name,
        email: client.email ?? "",
        phone: client.phone ?? "",
      }))}
    />
  );
}
