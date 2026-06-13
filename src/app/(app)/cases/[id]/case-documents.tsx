"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import {
  FileImage,
  FileText,
  Folder,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFolder,
  deleteDocument,
  renameFolder,
  uploadDocument,
} from "../../documents/actions";

export interface CaseDocument {
  id: string;
  fileName: string;
  fileType: string | null;
  folderId: string | null;
  uploadedAt: string;
  signedUrl: string | null;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
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
  folders,
}: {
  caseId: string;
  documents: CaseDocument[];
  folders: DocumentFolder[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const folderNameById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.name])),
    [folders]
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("caseId", caseId);
    if (selectedFolderId) formData.append("folderId", selectedFolderId);
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

  function handleCreateFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createFolder(formData);
      if (result.error) {
        toast.error("Could not create folder", { description: result.error });
      } else {
        setNewFolderName("");
        toast.success("Folder created");
      }
    });
  }

  function startRename(folder: DocumentFolder) {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  }

  function handleRenameFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await renameFolder(formData);
      if (result.error) {
        toast.error("Could not rename folder", { description: result.error });
      } else {
        setRenamingFolderId(null);
        setRenameValue("");
        toast.success("Folder renamed");
      }
    });
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <form onSubmit={handleCreateFolder} className="flex flex-1 gap-2">
          <input type="hidden" name="caseId" value={caseId} />
          <div className="min-w-0 flex-1">
            <Label htmlFor="case-folder-name" className="sr-only">
              Folder name
            </Label>
            <Input
              id="case-folder-name"
              name="name"
              placeholder="Create folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button type="submit" variant="outline" disabled={pending || !newFolderName.trim()}>
            <Folder data-icon="inline-start" />
            Create Folder
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <Label htmlFor="case-upload-folder" className="text-xs text-muted-foreground">
              Upload to
            </Label>
            <select
              id="case-upload-folder"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-48"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={uploading}
            >
              <option value="">Case root</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
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
      </div>

      {folders.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Folder className="size-4.5" />
              </span>
              {renamingFolderId === folder.id ? (
                <form onSubmit={handleRenameFolder} className="flex min-w-0 flex-1 gap-2">
                  <input type="hidden" name="folderId" value={folder.id} />
                  <Input
                    name="name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    disabled={pending}
                    className="h-8"
                  />
                  <Button type="submit" size="sm" disabled={pending || !renameValue.trim()}>
                    Save
                  </Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {documents.filter((doc) => doc.folderId === folder.id).length} documents
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => startRename(folder)}
                  >
                    <Pencil />
                    <span className="sr-only">Rename folder</span>
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

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
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {doc.fileName}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-medium">
                      {doc.fileName}
                    </p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">
                    {folderNameById.get(doc.folderId ?? "") ?? "Case root"} · {format(parseISO(doc.uploadedAt), "MMM d, yyyy")}
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
