import { format, parseISO } from "date-fns";
import { FileImage, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DocumentItem, DocumentType } from "@/lib/mock-data";

const typeStyles: Record<DocumentType, { icon: typeof FileText; className: string }> = {
  pdf: { icon: FileText, className: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" },
  docx: { icon: FileText, className: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  image: { icon: FileImage, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
};

export function DocumentList({
  documents,
  layout = "list",
}: {
  documents: DocumentItem[];
  layout?: "list" | "grid";
}) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          : "flex flex-col gap-2"
      )}
    >
      {documents.map((doc) => {
        const { icon: Icon, className } = typeStyles[doc.type];
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-hover"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                className
              )}
            >
              <Icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{doc.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {doc.caseTitle} · {format(parseISO(doc.uploadedDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
