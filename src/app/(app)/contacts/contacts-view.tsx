"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Mail, Phone, Plus, Search, Trash2 } from "lucide-react";
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
import {
  createContact,
  deleteContact,
  updateContact,
  type ContactPayload,
} from "./actions";

export interface ContactItem {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  caseId: string | null;
  caseTitle: string;
}

export interface CaseOption {
  id: string;
  title: string;
}

const NO_CASE = "none";

interface DraftState extends ContactPayload {
  id: string | null;
}

function emptyDraft(): DraftState {
  return {
    id: null,
    name: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    caseId: "",
  };
}

export function ContactsView({
  contacts,
  cases,
}: {
  contacts: ContactItem[];
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

  function openEdit(contact: ContactItem) {
    setDraft({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      caseId: contact.caseId ?? "",
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload: ContactPayload = {
      name: draft.name,
      role: draft.role,
      email: draft.email,
      phone: draft.phone,
      notes: draft.notes,
      caseId: draft.caseId,
    };
    const result = draft.id
      ? await updateContact(draft.id, payload)
      : await createContact(payload);

    setSaving(false);
    if (result.error) {
      toast.error("Could not save contact", { description: result.error });
      return;
    }
    toast.success(draft.id ? "Contact updated" : "Contact added");
    setOpen(false);
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteContact(id);
      if (result.error) {
        toast.error("Could not delete", { description: result.error });
      } else {
        toast.success("Contact deleted");
      }
    });
  }

  const filtered = contacts.filter((contact) => {
    const q = query.toLowerCase();
    return (
      contact.name.toLowerCase().includes(q) ||
      contact.role.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      contact.caseTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" />
          Add Contact
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search contacts..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {contacts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No contacts yet. Add a contact or create one from a case.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No contacts match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {contact.name}
                    </p>
                    {contact.role && (
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.role}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(contact)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => remove(contact.id)}
                    >
                      <Trash2 />
                      <span className="sr-only">Delete contact</span>
                    </Button>
                  </div>
                </div>
                {contact.email && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    {contact.email}
                  </p>
                )}
                {contact.phone && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" />
                    {contact.phone}
                  </p>
                )}
                {contact.caseId && (
                  <Link
                    href={`/cases/${contact.caseId}`}
                    className="block truncate text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {contact.caseTitle || "View case"}
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-role">Role</Label>
                <Input
                  id="contact-role"
                  placeholder="e.g. Witness"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-case">Case (optional)</Label>
              <Select
                value={draft.caseId === "" ? NO_CASE : draft.caseId}
                onValueChange={(value) =>
                  setDraft({ ...draft, caseId: value === NO_CASE ? "" : value })
                }
              >
                <SelectTrigger id="contact-case" className="w-full">
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
            <div className="space-y-1.5">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
                {draft.id ? "Save Changes" : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
