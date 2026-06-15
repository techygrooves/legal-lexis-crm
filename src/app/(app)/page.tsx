import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  ChevronRight,
  FileImage,
  FileText,
  FolderClosed,
  ListChecks,
  Users,
} from "lucide-react";

import { CaseCard } from "@/components/case-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/server";

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
    >
      {label}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { count: clientCount },
    { count: openCaseCount },
    { count: upcomingEventCount },
    { count: pendingTaskCount },
    { data: upcomingEvents },
    { data: recentCases },
    { data: pendingTasks },
    { data: recentDocuments },
    { data: caseTitleRows },
    { data: recentNotes },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "open"),
    supabase
      .from("case_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("event_date", today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("case_events")
      .select("id, title, event_type, event_date, start_time, end_time, location, case_id")
      .eq("user_id", user.id)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(5),
    supabase
      .from("cases")
      .select("id, title, court_name, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(4),
    supabase
      .from("documents")
      .select("id, file_name, file_type, case_id, file_path, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })
      .limit(4),
    supabase.from("cases").select("id, title, practice_area").eq("user_id", user.id),
    supabase
      .from("notes")
      .select("id, note, case_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const practiceAreaBreakdown = (() => {
    const map = new Map<string, number>();
    for (const row of caseTitleRows ?? []) {
      if (!row.practice_area) continue;
      map.set(row.practice_area, (map.get(row.practice_area) ?? 0) + 1);
    }
    const rows = [...map.entries()]
      .map(([label, count]) => ({
        label,
        count,
        href: `/cases?area=${encodeURIComponent(label)}`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const max = Math.max(...rows.map((r) => r.count), 1);
    return { rows, max };
  })();

  const caseTitleById = new Map(
    (caseTitleRows ?? []).map((row) => [row.id, row.title])
  );

  const recentDocs = await Promise.all(
    (recentDocuments ?? []).map(async (doc) => {
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
        caseId: doc.case_id,
        caseTitle: doc.case_id ? (caseTitleById.get(doc.case_id) ?? "") : "",
        uploadedAt: doc.uploaded_at,
        signedUrl,
      };
    })
  );

  const docIcon = (fileType: string | null) => {
    if (fileType?.startsWith("image/")) {
      return {
        Icon: FileImage,
        className:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
      };
    }
    if (fileType === "application/pdf") {
      return {
        Icon: FileText,
        className:
          "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
      };
    }
    return {
      Icon: FileText,
      className: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    };
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/clients" className="block">
          <StatCard label="Total Clients" value={clientCount ?? 0} icon={Users} interactive />
        </Link>
        <Link href="/cases?status=open" className="block">
          <StatCard
            label="Open Cases"
            value={openCaseCount ?? 0}
            icon={FolderClosed}
            interactive
          />
        </Link>
        <Link href="/calendar" className="block">
          <StatCard
            label="Upcoming Events"
            value={upcomingEventCount ?? 0}
            change="From today"
            icon={CalendarCheck}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            interactive
          />
        </Link>
        <Link href="/tasks" className="block">
          <StatCard
            label="Pending Tasks"
            value={pendingTaskCount ?? 0}
            icon={ListChecks}
            iconClassName="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            interactive
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcomingEvents ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No upcoming events.
              </p>
            )}
            {(upcomingEvents ?? []).map((event) => {
              const caseTitle = event.case_id
                ? caseTitleById.get(event.case_id)
                : undefined;
              const inner = (
                <>
                  <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5">
                    <span className="text-[10px] font-medium text-red-500 uppercase">
                      {format(parseISO(event.event_date), "MMM")}
                    </span>
                    <span className="text-base leading-5 font-semibold">
                      {format(parseISO(event.event_date), "d")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(event.event_date), "EEE")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.start_time
                        ? `${formatTime(event.start_time)}${
                            event.end_time ? ` - ${formatTime(event.end_time)}` : ""
                          }`
                        : "All day"}
                      {event.location && ` · ${event.location}`}
                      {caseTitle && ` · ${caseTitle}`}
                    </p>
                  </div>
                  <StatusBadge status={event.event_type} />
                </>
              );
              return event.case_id ? (
                <Link
                  key={event.id}
                  href={`/cases/${event.case_id}`}
                  className="-mx-1 flex items-start gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/50"
                >
                  {inner}
                </Link>
              ) : (
                <div key={event.id} className="flex items-start gap-3">
                  {inner}
                </div>
              );
            })}
            <ViewAllLink href="/calendar" label="View Calendar" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentCases ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No cases yet. Use Add Case to create your first one.
              </p>
            )}
            {(recentCases ?? []).map((caseRow) => (
              <CaseCard
                key={caseRow.id}
                caseItem={{
                  id: caseRow.id,
                  title: caseRow.title,
                  courtName: caseRow.court_name ?? "",
                  status: caseRow.status,
                }}
              />
            ))}
            <ViewAllLink href="/cases" label="View All Cases" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Due Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(pendingTasks ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No pending tasks.</p>
            )}
            {(pendingTasks ?? []).map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <Checkbox
                  className="mt-0.5"
                  aria-label={`Mark "${task.title}" complete`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                </div>
                {task.due_date && (
                  <span className="text-xs font-medium text-red-500">
                    {format(parseISO(task.due_date), "MMM d")}
                  </span>
                )}
              </div>
            ))}
            <ViewAllLink href="/tasks" label="View All Tasks" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cases by Practice Area</CardTitle>
          </CardHeader>
          <CardContent>
            {practiceAreaBreakdown.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No practice areas recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {practiceAreaBreakdown.rows.map((row) => (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{row.label}</span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${(row.count / practiceAreaBreakdown.max) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardAction>
              <ViewAllLink href="/notes" label="View All Notes" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentNotes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              (recentNotes ?? []).map((note) => (
                <div key={note.id} className="border-b pb-2 last:border-b-0">
                  <p className="line-clamp-2 text-sm">{note.note}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {note.case_id
                      ? caseTitleById.get(note.case_id) ?? "General"
                      : "General"}
                    {" · "}
                    {format(parseISO(note.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardAction>
            <ViewAllLink href="/documents" label="View All Documents" />
          </CardAction>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Upload documents from a case page.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recentDocs.map((doc) => {
                const { Icon, className } = docIcon(doc.fileType);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${className}`}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {doc.signedUrl ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {doc.fileName}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-medium">
                          {doc.fileName}
                        </p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.caseId ? (
                          <Link
                            href={`/cases/${doc.caseId}`}
                            className="hover:underline"
                          >
                            {doc.caseTitle || "View case"}
                          </Link>
                        ) : (
                          doc.caseTitle
                        )}
                        {" · "}
                        {format(parseISO(doc.uploadedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
