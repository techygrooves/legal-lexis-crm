"use client";

import Link from "next/link";
import { useState } from "react";
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

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  caseCount: number;
}

const columns: Column<ClientListItem>[] = [
  {
    header: "Client Name",
    cell: (client) => <span className="font-medium">{client.name}</span>,
  },
  {
    header: "Email",
    cell: (client) => client.email || "—",
    className: "text-muted-foreground",
  },
  {
    header: "Phone",
    cell: (client) => client.phone || "—",
    className: "text-muted-foreground",
  },
  {
    header: "Status",
    cell: (client) => <StatusBadge status={client.status} />,
  },
  {
    header: "Cases",
    cell: (client) => client.caseCount,
    className: "text-right",
  },
];

export function ClientsList({ clients }: { clients: ClientListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = clients.filter((client) => {
    const q = query.toLowerCase();
    const matchesQuery =
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q);
    const matchesStatus =
      status === "all" || client.status.toLowerCase() === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <Button asChild>
          <Link href="/cases/new">
            <Plus data-icon="inline-start" />
            Add Client
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          <DataTable
            columns={columns}
            data={filtered}
            getRowKey={(client) => client.id}
            emptyMessage={
              clients.length === 0
                ? "No clients yet. Clients are created with their first case via Add Case."
                : "No clients match your search."
            }
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {clients.length} clients
      </p>
    </div>
  );
}
