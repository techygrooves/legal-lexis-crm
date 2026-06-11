"use client";

import Link from "next/link";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Search } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cases, type Case } from "@/lib/mock-data";

const columns: Column<Case>[] = [
  {
    header: "Case",
    cell: (caseItem) => (
      <Link
        href={`/cases/${caseItem.id}`}
        className="font-medium hover:underline"
      >
        {caseItem.title}
      </Link>
    ),
  },
  {
    header: "Client",
    cell: (caseItem) => caseItem.clientName,
    className: "text-muted-foreground",
  },
  {
    header: "Practice Area",
    cell: (caseItem) => caseItem.practiceArea,
    className: "text-muted-foreground",
  },
  {
    header: "Case Number",
    cell: (caseItem) => caseItem.caseNumber,
    className: "text-muted-foreground",
  },
  {
    header: "Filed",
    cell: (caseItem) => format(parseISO(caseItem.filedDate), "MMM d, yyyy"),
    className: "text-muted-foreground",
  },
  {
    header: "Status",
    cell: (caseItem) => <StatusBadge status={caseItem.status} />,
  },
];

export default function CasesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = cases.filter((caseItem) => {
    const matchesQuery =
      caseItem.title.toLowerCase().includes(query.toLowerCase()) ||
      caseItem.clientName.toLowerCase().includes(query.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      status === "all" || caseItem.status.toLowerCase() === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
        <Button asChild>
          <Link href="/cases/new">
            <Plus data-icon="inline-start" />
            Add Case
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cases..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowKey={(caseItem) => caseItem.id}
            emptyMessage="No cases match your search."
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {cases.length} cases
      </p>
    </div>
  );
}
