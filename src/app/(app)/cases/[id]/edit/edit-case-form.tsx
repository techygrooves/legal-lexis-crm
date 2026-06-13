"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { updateCase, type UpdateCasePayload } from "../actions";

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

export function EditCaseForm({
  caseId,
  initial,
}: {
  caseId: string;
  initial: UpdateCasePayload;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(initial.status);
  const [practiceArea, setPracticeArea] = useState(initial.practiceArea);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const field = (name: string) => (formData.get(name) as string) ?? "";

    const result = await updateCase(caseId, {
      title: field("title"),
      practiceArea,
      caseNumber: field("caseNumber"),
      courtName: field("courtName"),
      courtNumber: field("courtNumber"),
      judgeName: field("judgeName"),
      opposingParty: field("opposingParty"),
      opposingAttorney: field("opposingAttorney"),
      status,
      filedDate: field("filedDate"),
      description: field("description"),
    });

    if (result.error) {
      toast.error("Could not save changes", { description: result.error });
      setSaving(false);
      return;
    }

    toast.success("Case updated");
    router.push(`/cases/${caseId}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/cases/${caseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Case
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Edit Case</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="title" label="Case Title">
              <Input id="title" name="title" defaultValue={initial.title} required />
            </Field>
            <Field id="practice-area" label="Practice Area">
              <Select value={practiceArea} onValueChange={setPracticeArea}>
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
              <Input id="case-number" name="caseNumber" defaultValue={initial.caseNumber} />
            </Field>
            <Field id="court-name" label="Court Name">
              <Input id="court-name" name="courtName" defaultValue={initial.courtName} />
            </Field>
            <Field id="court-number" label="Court Number">
              <Input id="court-number" name="courtNumber" defaultValue={initial.courtNumber} />
            </Field>
            <Field id="judge-name" label="Judge Name">
              <Input id="judge-name" name="judgeName" defaultValue={initial.judgeName} />
            </Field>
            <Field id="opposing-party" label="Opposing Party">
              <Input id="opposing-party" name="opposingParty" defaultValue={initial.opposingParty} />
            </Field>
            <Field id="opposing-attorney" label="Opposing Attorney">
              <Input id="opposing-attorney" name="opposingAttorney" defaultValue={initial.opposingAttorney} />
            </Field>
            <Field id="case-status" label="Case Status">
              <Select value={status} onValueChange={setStatus}>
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
              <Input id="filed-date" name="filedDate" type="date" defaultValue={initial.filedDate} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="description" label="Description">
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={initial.description}
                  placeholder="Case summary, background, status..."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/cases/${caseId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
