"use client";

import { useState } from "react";
import { Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { DocumentList } from "@/components/document-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documents } from "@/lib/mock-data";

export default function DocumentsPage() {
  const [query, setQuery] = useState("");

  const filtered = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.caseTitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <Button onClick={() => toast.info("Uploads come with the database hookup.")}>
          <Upload data-icon="inline-start" />
          Upload Document
        </Button>
      </div>

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

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No documents match your search.
        </p>
      ) : (
        <DocumentList documents={filtered} layout="grid" />
      )}
    </div>
  );
}
