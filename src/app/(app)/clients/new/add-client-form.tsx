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
import { createClientRecord } from "../actions";

export interface CaseOption {
  id: string;
  title: string;
}

const NO_CASE = "none";

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

export function AddClientForm({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [caseId, setCaseId] = useState(NO_CASE);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const field = (name: string) => (formData.get(name) as string) ?? "";

    const result = await createClientRecord({
      fullName: field("fullName"),
      email: field("email"),
      phone: field("phone"),
      address: field("address"),
      source: field("source"),
      notes: field("notes"),
      caseId: caseId === NO_CASE ? "" : caseId,
    });

    if (result.error && !result.clientId) {
      toast.error("Could not create client", { description: result.error });
      setSubmitting(false);
      return;
    }

    if (result.error) {
      toast.warning(result.error);
    } else {
      toast.success("Client created");
    }
    router.push(`/clients/${result.clientId}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Clients
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Add Client</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Add a client on their own, or link them to an existing case below.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="full-name" label="Full Name">
              <Input id="full-name" name="fullName" placeholder="Jane Doe" required />
            </Field>
            <Field id="email" label="Email">
              <Input id="email" name="email" type="email" placeholder="jane@email.com" />
            </Field>
            <Field id="phone" label="Phone">
              <Input id="phone" name="phone" type="tel" placeholder="(555) 000-0000" />
            </Field>
            <Field id="source" label="Source">
              <Input id="source" name="source" placeholder="e.g. Referral" />
            </Field>
            <div className="sm:col-span-2">
              <Field id="address" label="Address">
                <Input id="address" name="address" placeholder="123 Main St, Miami, FL" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="notes" label="Notes">
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Anything worth remembering about this client..."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case (optional)</CardTitle>
            <CardDescription>
              Link this client to one of your existing cases, or leave as
              &ldquo;No case&rdquo; to add them on their own. To create a new
              case for a client, use Add Case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field id="case" label="Link to existing case">
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger id="case" className="w-full">
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
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Create Client
          </Button>
        </div>
      </form>
    </div>
  );
}
