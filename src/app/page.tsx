import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarCheck,
  ChevronRight,
  FolderClosed,
  ListChecks,
  Users,
} from "lucide-react";

import { CaseCard } from "@/components/case-card";
import { DocumentList } from "@/components/document-list";
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
import { cases, documents, events, stats, tasks } from "@/lib/mock-data";

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

export default function DashboardPage() {
  const upcomingEvents = events
    .filter((event) => event.date >= "2026-06-11")
    .slice(0, 3);
  const pendingTasks = tasks.filter((task) => !task.completed).slice(0, 4);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Clients"
          value={stats.totalClients.value}
          change={stats.totalClients.change}
          icon={Users}
        />
        <StatCard
          label="Open Cases"
          value={stats.openCases.value}
          change={stats.openCases.change}
          icon={FolderClosed}
        />
        <StatCard
          label="Upcoming Events"
          value={stats.upcomingEvents.value}
          change={stats.upcomingEvents.change}
          icon={CalendarCheck}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks.value}
          change={stats.pendingTasks.change}
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
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5">
                  <span className="text-[10px] font-medium text-red-500 uppercase">
                    {format(parseISO(event.date), "MMM")}
                  </span>
                  <span className="text-base leading-5 font-semibold">
                    {format(parseISO(event.date), "d")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(event.date), "EEE")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.startTime
                      ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
                      : "All day"}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                <StatusBadge status={event.type} />
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
            {cases.slice(0, 4).map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
            <ViewAllLink href="/cases" label="View All Cases" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Due Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <Checkbox className="mt-0.5" aria-label={`Mark "${task.title}" complete`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.caseTitle}
                  </p>
                </div>
                <span className="text-xs font-medium text-red-500">
                  {format(parseISO(task.dueDate), "MMM d")}
                </span>
              </div>
            ))}
            <ViewAllLink href="/tasks" label="View All Tasks" />
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
          <DocumentList documents={documents.slice(0, 4)} layout="grid" />
        </CardContent>
      </Card>
    </div>
  );
}
