"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNote, deleteNote, updateNote } from "./actions";

export interface NoteItem {
  id: string;
  note: string;
  caseId: string | null;
  caseTitle: string;
  createdAt: string;
}

export interface CaseOption {
  id: string;
  title: string;
}

const NO_CASE = "none";

interface DraftState {
  id: string | null;
  note: string;
  caseId: string;
}

function emptyDraft(): DraftState {
  return { id: null, note: "", caseId: "" };
}

export function NotesView({
  notes,
  cases,
}: {
  notes: NoteItem[];
  cases: CaseOption[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());
  const [pending, startTransition] = useTransition();

  function openAdd() {
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(note: NoteItem) {
    setDraft({ id: note.id, note: note.note, caseId: note.caseId ?? "" });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = { note: draft.note, caseId: draft.caseId };
    const result = draft.id
      ? await updateNote(draft.id, payload)
      : await createNote(payload);

    setSaving(false);
    if (result.error) {
      toast.error("Could not save note", { description: result.error });
      return;
    }
    toast.success(draft.id ? "Note updated" : "Note added");
    setOpen(false);
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteNote(id);
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
      } else {
        toast.success("Note deleted");
      }
    });
  }

  const filtered = notes.filter((note) => {
    const q = query.toLowerCase();
    return (
      note.note.toLowerCase().includes(q) ||
      note.caseTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" />
          Add Note
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notes..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {notes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No notes yet. Add a note or create one from a case.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No notes match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((note) => (
            <Card key={note.id} className="transition-colors hover:bg-hover">
              <CardContent className="space-y-2 px-4 py-3">
                <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-muted-foreground">
                    {note.caseId ? (
                      <Link
                        href={`/cases/${note.caseId}`}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {note.caseTitle || "View case"}
                      </Link>
                    ) : (
                      "General"
                    )}
                    {" · "}
                    {format(parseISO(note.createdAt), "MMM d, yyyy")}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(note)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => remove(note.id)}
                    >
                      <Trash2 />
                      <span className="sr-only">Delete note</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Note" : "Add Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-text">Note</Label>
              <Textarea
                id="note-text"
                rows={5}
                placeholder="Write a note..."
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-case">Case (optional)</Label>
              <Select
                value={draft.caseId === "" ? NO_CASE : draft.caseId}
                onValueChange={(value) =>
                  setDraft({ ...draft, caseId: value === NO_CASE ? "" : value })
                }
              >
                <SelectTrigger id="note-case" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CASE}>No case</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
                {draft.id ? "Save Changes" : "Add Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
