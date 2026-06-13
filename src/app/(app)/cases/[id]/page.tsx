import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  CaseDocuments,
  type CaseDocument,
  type DocumentFolder,
} from "./case-documents";
import { DeleteCaseButton } from "./delete-case-button";

function formatTime(time: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default async function CaseDetailPage({
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

  const [
    { data: client },
    { data: events },
    { data: tasks },
    { data: notes },
    { data: contacts },
    { data: folderRows },
    { data: documentRows },
  ] = await Promise.all([
    caseRow.client_id
      ? supabase
          .from("clients")
          .select("id, full_name, email, phone")
          .eq("id", caseRow.client_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("case_events")
      .select("*")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("*")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("*")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("document_folders")
      .select("id, name, parent_folder_id, created_at")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("documents")
      .select("id, file_name, file_type, folder_id, uploaded_at, file_path")
      .eq("case_id", id)
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false }),
  ]);

  // Private bucket: mint short-lived signed URLs for each document so the
  // file names can link directly. Missing bucket/policies just yields no link.
  const documents: CaseDocument[] = await Promise.all(
    (documentRows ?? []).map(async (doc) => {
      let signedUrl: string | null = null;
      if (doc.file_path) {
        const { data: signed } = await supabase.storage
          .from("case-documents")
          .createSignedUrl(doc.file_path, 60 * 60);
        signedUrl = signed?.signedUrl ?? null;
      }
      return {
        id: doc.id,
        fileName: doc.file_name,
        fileType: doc.file_type,
        folderId: doc.folder_id,
        uploadedAt: doc.uploaded_at,
        signedUrl,
      };
    })
  );

  const folders: DocumentFolder[] = (folderRows ?? []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parent_folder_id,
  }));

  const details: [string, string][] = [
    ["Practice Area", caseRow.practice_area ?? "—"],
    ["Case Number", caseRow.case_number ?? "—"],
    ["Court", caseRow.court_name ?? "—"],
    ["Court Number", caseRow.court_number ?? "—"],
    ["Judge", caseRow.judge_name ?? "—"],
    ["Opposing Party", caseRow.opposing_party ?? "—"],
    ["Opposing Attorney", caseRow.opposing_attorney ?? "—"],
    [
      "Filed Date",
      caseRow.filed_date
        ? format(parseISO(caseRow.filed_date), "MMMM d, yyyy")
        : "—",
    ],
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Cases
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {caseRow.title}
        </h1>
        <StatusBadge status={caseRow.status} />
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/cases/${caseRow.id}/edit`}>
              <Pencil data-icon="inline-start" />
              Edit
            </Link>
          </Button>
          <DeleteCaseButton caseId={caseRow.id} caseTitle={caseRow.title} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Client:{" "}
        <span className="text-foreground">{client?.full_name ?? "—"}</span>
        {client?.email && (
          <span className="text-muted-foreground"> · {client.email}</span>
        )}
        {client?.phone && (
          <span className="text-muted-foreground"> · {client.phone}</span>
        )}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
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
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              {(notes ?? []).length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No notes yet.
                </p>
              ) : (
                <div className="mt-1 space-y-3">
                  {(notes ?? []).map((note) => (
                    <div key={note.id} className="text-sm">
                      <p className="whitespace-pre-wrap">{note.note}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(parseISO(note.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(events ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No upcoming dates.
                </p>
              )}
              {(events ?? []).map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1">
                    <span className="text-[10px] font-medium text-red-500 uppercase">
                      {format(parseISO(event.event_date), "MMM")}
                    </span>
                    <span className="text-base leading-5 font-semibold">
                      {format(parseISO(event.event_date), "d")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatTime(event.start_time) ?? "All day"}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                  <StatusBadge status={event.event_type} className="ml-auto" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasks ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No open tasks.</p>
              )}
              {(tasks ?? []).map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="truncate">{task.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.due_date
                      ? format(parseISO(task.due_date), "MMM d")
                      : "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(contacts ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No related contacts.
                </p>
              )}
              {(contacts ?? []).map((contact) => (
                <div key={contact.id} className="text-sm">
                  <p className="font-medium">
                    {contact.name}
                    {contact.role && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        · {contact.role}
                      </span>
                    )}
                  </p>
                  {(contact.email || contact.phone) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[contact.email, contact.phone]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseDocuments
            caseId={caseRow.id}
            documents={documents}
            folders={folders}
          />
        </CardContent>
      </Card>
    </div>
  );
}
