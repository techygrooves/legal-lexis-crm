import Link from "next/link";
import { ChevronRight, FolderClosed } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";

export interface CaseCardData {
  id: string;
  title: string;
  courtName: string;
  status: string;
}

export function CaseCard({ caseItem }: { caseItem: CaseCardData }) {
  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-hover dark:hover:border-indigo-900"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        <FolderClosed className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{caseItem.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {caseItem.courtName || "—"}
        </p>
      </div>
      <StatusBadge status={caseItem.status} />
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500" />
    </Link>
  );
}
