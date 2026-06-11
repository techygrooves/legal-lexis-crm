import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { DocumentList } from "@/components/document-list";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cases, documents, events, tasks } from "@/lib/mock-data";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseItem = cases.find((c) => c.id === id);
  if (!caseItem) notFound();

  const caseDocuments = documents.filter(
    (doc) => doc.caseTitle === caseItem.title
  );
  const caseTasks = tasks.filter((task) => task.caseTitle === caseItem.title);
  const caseEvents = events
    .filter((event) => event.title.includes(caseItem.title.split(" ")[0]))
    .slice(0, 3);

  const details: [string, string][] = [
    ["Practice Area", caseItem.practiceArea],
    ["Case Number", caseItem.caseNumber],
    ["Court", caseItem.courtName],
    ["Court Number", caseItem.courtNumber],
    ["Judge", caseItem.judgeName],
    ["Opposing Party", caseItem.opposingParty],
    ["Opposing Attorney", caseItem.opposingAttorney],
    ["Filed Date", format(parseISO(caseItem.filedDate), "MMMM d, yyyy")],
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
          {caseItem.title}
        </h1>
        <StatusBadge status={caseItem.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        Client: <span className="text-foreground">{caseItem.clientName}</span>
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b pb-2 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{caseItem.notes}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {caseEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No upcoming dates.
                </p>
              )}
              {caseEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1">
                    <span className="text-[10px] font-medium text-red-500 uppercase">
                      {format(parseISO(event.date), "MMM")}
                    </span>
                    <span className="text-base leading-5 font-semibold">
                      {format(parseISO(event.date), "d")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.type}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.startTime ?? "All day"}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {caseTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No open tasks.</p>
              )}
              {caseTasks.map((task) => (
                <div key={task.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{task.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(parseISO(task.dueDate), "MMM d")}
                  </span>
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
          {caseDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <DocumentList documents={caseDocuments} layout="grid" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
