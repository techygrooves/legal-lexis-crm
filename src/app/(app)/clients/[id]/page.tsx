import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { CaseCard } from "@/components/case-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDetailPage({
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

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, court_name, status")
    .eq("client_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const details: [string, string][] = [
    ["Email", client.email ?? "—"],
    ["Phone", client.phone ?? "—"],
    ["Address", client.address ?? "—"],
    ["Source", client.source ?? "—"],
    [
      "Client Since",
      client.created_at
        ? format(parseISO(client.created_at), "MMMM d, yyyy")
        : "—",
    ],
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Clients
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {client.full_name}
        </h1>
        <StatusBadge status={client.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b pb-2 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {client.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases ({(cases ?? []).length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(cases ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cases for this client yet.
              </p>
            ) : (
              (cases ?? []).map((caseRow) => (
                <CaseCard
                  key={caseRow.id}
                  caseItem={{
                    id: caseRow.id,
                    title: caseRow.title,
                    courtName: caseRow.court_name ?? "",
                    status: caseRow.status,
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
