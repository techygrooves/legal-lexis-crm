"use client";

import { useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { FileImage, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteDocument, uploadDocument } from "./actions";

export interface CaseDocument {
  id: string;
  fileName: string;
  fileType: string | null;
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

export function CaseDocuments({
  caseId,
  documents,
}: {
  caseId: string;
  documents: CaseDocument[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("caseId", caseId);
    formData.append("file", file);

    const result = await uploadDocument(formData);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.error) {
      toast.error("Upload failed", { description: result.error });
    } else {
      toast.success("Document uploaded");
    }
  }

  function handleDelete(documentId: string) {
    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
      } else {
        toast.success("Document deleted");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Upload data-icon="inline-start" />
          )}
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => {
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
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {doc.fileName}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-medium">
                      {doc.fileName}
                    </p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {format(parseISO(doc.uploadedAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 />
                  <span className="sr-only">Delete document</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
