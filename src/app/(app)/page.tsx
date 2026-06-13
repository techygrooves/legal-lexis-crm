import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  ChevronRight,
  FolderClosed,
  ListChecks,
  Users,
} from "lucide-react";

import { CaseCard } from "@/components/case-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
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
      .select("id, title, event_type, event_date, start_time, end_time, location")
      .eq("user_id", user.id)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(3),
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
  ]);

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
        <StatCard
          label="Total Clients"
          value={clientCount ?? 0}
          icon={Users}
        />
        <StatCard
          label="Open Cases"
          value={openCaseCount ?? 0}
          icon={FolderClosed}
        />
        <StatCard
          label="Upcoming Events"
          value={upcomingEventCount ?? 0}
          change="From today"
          icon={CalendarCheck}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <StatCard
          label="Pending Tasks"
          value={pendingTaskCount ?? 0}
          icon={ListChecks}
          iconClassName="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        />
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
            {(upcomingEvents ?? []).map((event) => (
              <div key={event.id} className="flex items-start gap-3">
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
                  </p>
                </div>
                <StatusBadge status={event.event_type} />
              </div>
            ))}
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No documents yet. Document upload will be added later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
