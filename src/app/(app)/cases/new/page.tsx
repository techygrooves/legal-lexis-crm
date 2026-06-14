"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, Loader2, Paperclip, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { practiceAreas } from "@/lib/mock-data";
import { uploadDocument } from "@/app/(app)/documents/actions";
import { createCase } from "./actions";

interface ImportantDate {
  label: string;
  type: string;
  date: string;
}

interface TaskEntry {
  title: string;
  dueDate: string;
}

interface ContactEntry {
  name: string;
  role: string;
  email: string;
  phone: string;
}

const eventTypes = ["hearing", "meeting", "deadline", "conference"];

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function AddCasePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([
    { label: "", type: "hearing", date: "" },
  ]);
  const [taskList, setTaskList] = useState<TaskEntry[]>([
    { title: "", dueDate: "" },
  ]);
  const [contactList, setContactList] = useState<ContactEntry[]>([
    { name: "", role: "", email: "", phone: "" },
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const field = (name: string) => (formData.get(name) as string) ?? "";

    const result = await createCase({
      client: {
        fullName: field("clientName"),
        email: field("clientEmail"),
        phone: field("clientPhone"),
        address: field("clientAddress"),
        source: field("clientSource"),
      },
      caseDetails: {
        title: field("caseTitle"),
        practiceArea: field("practiceArea"),
        caseNumber: field("caseNumber"),
        courtName: field("courtName"),
        courtNumber: field("courtNumber"),
        judgeName: field("judgeName"),
        opposingParty: field("opposingParty"),
        opposingAttorney: field("opposingAttorney"),
        stateAttorney: field("stateAttorney"),
        stateAttorneyPhone: field("stateAttorneyPhone"),
        charge: field("charge"),
        insuranceCompany: field("insuranceCompany"),
        insuranceAgentPhone: field("insuranceAgentPhone"),
        status: field("caseStatus"),
        filedDate: field("filedDate"),
      },
      events: importantDates.map((entry) => ({
        title: entry.label,
        eventType: entry.type,
        eventDate: entry.date,
      })),
      tasks: taskList.map((task) => ({
        title: task.title,
        dueDate: task.dueDate,
      })),
      note: field("notes"),
      contacts: contactList,
    });

    if (result.error || !result.caseId) {
      toast.error("Could not create case", { description: result.error });
      setSubmitting(false);
      return;
    }

    const caseId = result.caseId;

    // Documents attach to the case we just created (uploaded to its root
    // folder). This works whether or not a case number was provided.
    let uploadFailures = 0;
    for (const file of files) {
      const documentData = new FormData();
      documentData.append("caseId", caseId);
      documentData.append("file", file);
      const upload = await uploadDocument(documentData);
      if (upload.error) uploadFailures += 1;
    }

    if (result.warning) {
      toast.warning(result.warning);
    } else if (uploadFailures > 0) {
      toast.warning(
        `Case created, but ${uploadFailures} document${
          uploadFailures > 1 ? "s" : ""
        } could not be uploaded.`
      );
    } else {
      toast.success("Case created");
    }
    router.push(`/cases/${caseId}`);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Cases
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Add Case</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Who is this case for? A new client record is created
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="client-name" label="Client Name">
              <Input id="client-name" name="clientName" placeholder="Jane Doe" required />
            </Field>
            <Field id="client-email" label="Client Email">
              <Input id="client-email" name="clientEmail" type="email" placeholder="jane@email.com" />
            </Field>
            <Field id="client-phone" label="Client Phone">
              <Input id="client-phone" name="clientPhone" type="tel" placeholder="(555) 000-0000" />
            </Field>
            <Field id="client-address" label="Client Address">
              <Input id="client-address" name="clientAddress" placeholder="123 Main St, Miami, FL" />
            </Field>
            <Field id="client-source" label="Source">
              <Input id="client-source" name="clientSource" placeholder="e.g. Referral" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="case-title" label="Case Title">
              <Input id="case-title" name="caseTitle" placeholder="Doe v. Acme Inc" required />
            </Field>
            <Field id="practice-area" label="Practice Area">
              <Select name="practiceArea">
                <SelectTrigger id="practice-area" className="w-full">
                  <SelectValue placeholder="Select practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="case-number" label="Case Number">
              <Input id="case-number" name="caseNumber" placeholder="2026-CV-00000" />
            </Field>
            <Field id="court-name" label="Court Name">
              <Input id="court-name" name="courtName" placeholder="Florida County Court" />
            </Field>
            <Field id="court-number" label="Court Number">
              <Input id="court-number" name="courtNumber" placeholder="11th Judicial Circuit" />
            </Field>
            <Field id="judge-name" label="Judge Name">
              <Input id="judge-name" name="judgeName" placeholder="Hon. Jane Smith" />
            </Field>
            <Field id="opposing-party" label="Opposing Party">
              <Input id="opposing-party" name="opposingParty" placeholder="Acme Inc" />
            </Field>
            <Field id="opposing-attorney" label="Opposing Attorney">
              <Input id="opposing-attorney" name="opposingAttorney" placeholder="John Counsel, Esq." />
            </Field>
            <Field id="state-attorney" label="State Attorney">
              <Input id="state-attorney" name="stateAttorney" placeholder="Prosecutor name" />
            </Field>
            <Field id="state-attorney-phone" label="State Attorney Phone">
              <Input id="state-attorney-phone" name="stateAttorneyPhone" type="tel" placeholder="(555) 000-0000" />
            </Field>
            <Field id="charge" label="Charge">
              <Input id="charge" name="charge" placeholder="e.g. DUI - first offense" />
            </Field>
            <Field id="insurance-company" label="Insurance Company">
              <Input id="insurance-company" name="insuranceCompany" placeholder="Insurance company name" />
            </Field>
            <Field id="insurance-agent-phone" label="Insurance Agent Phone">
              <Input id="insurance-agent-phone" name="insuranceAgentPhone" type="tel" placeholder="(555) 000-0000" />
            </Field>
            <Field id="case-status" label="Case Status">
              <Select name="caseStatus" defaultValue="open">
                <SelectTrigger id="case-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="filed-date" label="Filed Date">
              <Input id="filed-date" name="filedDate" type="date" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
            <CardDescription>
              Hearings, deadlines, and other key dates for this case.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {importantDates.map((entry, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="min-w-40 flex-1 space-y-1.5">
                  <Label htmlFor={`date-label-${index}`}>Label</Label>
                  <Input
                    id={`date-label-${index}`}
                    placeholder="e.g. Initial Hearing"
                    value={entry.label}
                    onChange={(e) =>
                      setImportantDates((dates) =>
                        dates.map((d, i) =>
                          i === index ? { ...d, label: e.target.value } : d
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`date-type-${index}`}>Type</Label>
                  <Select
                    value={entry.type}
                    onValueChange={(value) =>
                      setImportantDates((dates) =>
                        dates.map((d, i) =>
                          i === index ? { ...d, type: value } : d
                        )
                      )
                    }
                  >
                    <SelectTrigger id={`date-type-${index}`} className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`date-value-${index}`}>Date</Label>
                  <Input
                    id={`date-value-${index}`}
                    type="date"
                    value={entry.date}
                    onChange={(e) =>
                      setImportantDates((dates) =>
                        dates.map((d, i) =>
                          i === index ? { ...d, date: e.target.value } : d
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={importantDates.length === 1}
                  onClick={() =>
                    setImportantDates((dates) =>
                      dates.filter((_, i) => i !== index)
                    )
                  }
                >
                  <Trash2 />
                  <span className="sr-only">Remove date</span>
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setImportantDates((dates) => [
                  ...dates,
                  { label: "", type: "hearing", date: "" },
                ])
              }
            >
              <Plus data-icon="inline-start" />
              Add Date
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Initial to-dos for this case.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {taskList.map((task, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="min-w-40 flex-1 space-y-1.5">
                  <Label htmlFor={`task-title-${index}`}>Task</Label>
                  <Input
                    id={`task-title-${index}`}
                    placeholder="e.g. Draft engagement letter"
                    value={task.title}
                    onChange={(e) =>
                      setTaskList((list) =>
                        list.map((t, i) =>
                          i === index ? { ...t, title: e.target.value } : t
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`task-due-${index}`}>Due Date</Label>
                  <Input
                    id={`task-due-${index}`}
                    type="date"
                    value={task.dueDate}
                    onChange={(e) =>
                      setTaskList((list) =>
                        list.map((t, i) =>
                          i === index ? { ...t, dueDate: e.target.value } : t
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={taskList.length === 1}
                  onClick={() =>
                    setTaskList((list) => list.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 />
                  <span className="sr-only">Remove task</span>
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTaskList((list) => [...list, { title: "", dueDate: "" }])
              }
            >
              <Plus data-icon="inline-start" />
              Add Task
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Contacts</CardTitle>
            <CardDescription>
              Optional people connected to this case — opposing counsel,
              witnesses, experts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactList.map((contact, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="min-w-36 flex-1 space-y-1.5">
                  <Label htmlFor={`contact-name-${index}`}>Name</Label>
                  <Input
                    id={`contact-name-${index}`}
                    placeholder="Full name"
                    value={contact.name}
                    onChange={(e) =>
                      setContactList((list) =>
                        list.map((c, i) =>
                          i === index ? { ...c, name: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>
                <div className="min-w-28 space-y-1.5">
                  <Label htmlFor={`contact-role-${index}`}>Role</Label>
                  <Input
                    id={`contact-role-${index}`}
                    placeholder="e.g. Witness"
                    value={contact.role}
                    onChange={(e) =>
                      setContactList((list) =>
                        list.map((c, i) =>
                          i === index ? { ...c, role: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>
                <div className="min-w-36 space-y-1.5">
                  <Label htmlFor={`contact-email-${index}`}>Email</Label>
                  <Input
                    id={`contact-email-${index}`}
                    type="email"
                    placeholder="email@example.com"
                    value={contact.email}
                    onChange={(e) =>
                      setContactList((list) =>
                        list.map((c, i) =>
                          i === index ? { ...c, email: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>
                <div className="min-w-28 space-y-1.5">
                  <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                  <Input
                    id={`contact-phone-${index}`}
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={contact.phone}
                    onChange={(e) =>
                      setContactList((list) =>
                        list.map((c, i) =>
                          i === index ? { ...c, phone: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={contactList.length === 1}
                  onClick={() =>
                    setContactList((list) => list.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 />
                  <span className="sr-only">Remove contact</span>
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContactList((list) => [
                  ...list,
                  { name: "", role: "", email: "", phone: "" },
                ])
              }
            >
              <Plus data-icon="inline-start" />
              Add Contact
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes & Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="notes" label="Notes">
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Case strategy, background, first impressions..."
              />
            </Field>
            <div className="space-y-2">
              <Label>Documents</Label>
              <p className="text-xs text-muted-foreground">
                Files attach to this case (uploaded to the case root folder).
                You can organize them into folders on the case page afterward.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={handleFilesSelected}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip data-icon="inline-start" />
                Choose Files
              </Button>
              {files.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={submitting}
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/cases">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            Create Case
          </Button>
        </div>
      </form>
    </div>
  );
}
