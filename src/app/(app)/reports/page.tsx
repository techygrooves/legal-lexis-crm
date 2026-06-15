import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarClock,
  ChevronRight,
  FileText,
  FolderClosed,
  ListChecks,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Breakdown({
  rows,
  emptyLabel,
}: {
  rows: { label: string; count: number; href?: string }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const inner = (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {row.count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </>
        );
        return row.href ? (
          <Link
            key={row.label}
            href={row.href}
            className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-hover"
          >
            <div className="min-w-0 flex-1 space-y-1">{inner}</div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </Link>
        ) : (
          <div key={row.label} className="space-y-1">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { data: clients },
    { data: cases },
    { data: tasks },
    { count: upcomingDeadlines },
    { count: documentCount },
  ] = await Promise.all([
    supabase.from("clients").select("status").eq("user_id", user.id),
    supabase
      .from("cases")
      .select("status, practice_area")
      .eq("user_id", user.id),
    supabase.from("tasks").select("status").eq("user_id", user.id),
    supabase
      .from("case_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "deadline")
      .gte("event_date", today),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const clientRows = clients ?? [];
  const caseRows = cases ?? [];
  const taskRows = tasks ?? [];

  const activeClients = clientRows.filter((c) => c.status === "active").length;
  const openCases = caseRows.filter((c) => c.status === "open").length;
  const pendingTasks = taskRows.filter((t) => t.status === "pending").length;

  const countBy = <T,>(items: T[], key: (item: T) => string | null) => {
    const map = new Map<string, number>();
    for (const item of items) {
      const value = key(item);
      if (!value) continue;
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  const casesByStatus = countBy(caseRows, (c) => titleCase(c.status)).map(
    (r) => ({ ...r, href: `/cases?status=${r.label.toLowerCase()}` })
  );
  const casesByPracticeArea = countBy(caseRows, (c) => c.practice_area).map(
    (r) => ({ ...r, href: `/cases?area=${encodeURIComponent(r.label)}` })
  );
  const tasksByStatus = countBy(taskRows, (t) => titleCase(t.status)).map(
    (r) => ({ ...r, href: "/tasks" })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/clients" className="block">
          <StatCard
            label="Total Clients"
            value={clientRows.length}
            change={`${activeClients} active`}
            icon={Users}
            interactive
          />
        </Link>
        <Link href="/cases" className="block">
          <StatCard
            label="Total Cases"
            value={caseRows.length}
            change={`${openCases} open`}
            icon={FolderClosed}
            interactive
          />
        </Link>
        <Link href="/tasks" className="block">
          <StatCard
            label="Pending Tasks"
            value={pendingTasks}
            change={`${taskRows.length} total`}
            icon={ListChecks}
            iconClassName="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            interactive
          />
        </Link>
        <Link href="/calendar" className="block">
          <StatCard
            label="Upcoming Deadlines"
            value={upcomingDeadlines ?? 0}
            change="From today"
            icon={CalendarClock}
            iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            interactive
          />
        </Link>
        <Link href="/documents" className="block">
          <StatCard
            label="Documents"
            value={documentCount ?? 0}
            icon={FileText}
            iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            interactive
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown rows={casesByStatus} emptyLabel="No cases yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cases by Practice Area</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown
              rows={casesByPracticeArea}
              emptyLabel="No practice areas recorded."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Breakdown rows={tasksByStatus} emptyLabel="No tasks yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
