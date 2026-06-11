"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Paperclip, Plus, Trash2 } from "lucide-react";
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

interface ImportantDate {
  label: string;
  date: string;
}

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
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([
    { label: "", date: "" },
  ]);
  const [taskList, setTaskList] = useState<string[]>([""]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Mock only — Supabase persistence comes later.
    toast.success("Case created", {
      description: "Saved locally as mock data. Database hookup comes next.",
    });
    router.push("/cases");
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
              Who is this case for? New clients are created automatically.
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
            <Field id="case-status" label="Case Status">
              <Select name="caseStatus" defaultValue="Open">
                <SelectTrigger id="case-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
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
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`date-label-${index}`}>Label</Label>
                  <Input
                    id={`date-label-${index}`}
                    placeholder="e.g. Hearing"
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
                setImportantDates((dates) => [...dates, { label: "", date: "" }])
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
              <div key={index} className="flex items-center gap-3">
                <Input
                  placeholder="e.g. Draft engagement letter"
                  aria-label={`Task ${index + 1}`}
                  value={task}
                  onChange={(e) =>
                    setTaskList((list) =>
                      list.map((t, i) => (i === index ? e.target.value : t))
                    )
                  }
                />
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
              onClick={() => setTaskList((list) => [...list, ""])}
            >
              <Plus data-icon="inline-start" />
              Add Task
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
            <Field id="documents" label="Documents">
              <label
                htmlFor="documents"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <Paperclip className="size-4" />
                Click to attach files (mock — not uploaded yet)
              </label>
              <input id="documents" name="documents" type="file" multiple className="sr-only" />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/cases">Cancel</Link>
          </Button>
          <Button type="submit">Create Case</Button>
        </div>
      </form>
    </div>
  );
}
