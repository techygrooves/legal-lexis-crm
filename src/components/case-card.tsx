import Link from "next/link";
import { FolderClosed } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { Case } from "@/lib/mock-data";

export function CaseCard({ caseItem }: { caseItem: Case }) {
  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        <FolderClosed className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{caseItem.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {caseItem.courtName}
        </p>
      </div>
      <StatusBadge status={caseItem.status} />
    </Link>
  );
}
