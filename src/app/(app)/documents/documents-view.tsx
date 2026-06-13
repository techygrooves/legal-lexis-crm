"use client";

import Link from "next/link";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { FileImage, FileText, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DocumentListItem {
  id: string;
  fileName: string;
  fileType: string | null;
  caseId: string | null;
  caseTitle: string;
  uploadedAt: string;
  signedUrl: string | null;
}

function iconFor(fileType: string | null) {
  if (fileType?.startsWith("image/")) {
    return { Icon: FileImage, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" };
  }
  if (fileType === "application/pdf") {
    return { Icon: FileText, className: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" };
  }
  return { Icon: FileText, className: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" };
}

export function DocumentsView({ documents }: { documents: DocumentListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = documents.filter((doc) => {
    const q = query.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(q) ||
      doc.caseTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documents..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {documents.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No documents yet. Upload documents from a case page.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No documents match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => {
            const { Icon, className } = iconFor(doc.fileType);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    className
                  )}
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
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
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
    </div>
  );
}
