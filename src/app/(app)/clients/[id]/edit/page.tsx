import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EditClientForm } from "./edit-client-form";

export default async function EditClientPage({
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

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <EditClientForm
      clientId={client.id}
      initial={{
        fullName: client.full_name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        source: client.source ?? "",
        status: client.status,
        notes: client.notes ?? "",
      }}
    />
  );
}
