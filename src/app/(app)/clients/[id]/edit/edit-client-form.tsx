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
import { updateClient, type UpdateClientPayload } from "../../actions";

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

export function EditClientForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: UpdateClientPayload;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(initial.status || "active");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const field = (name: string) => (formData.get(name) as string) ?? "";

    const result = await updateClient(clientId, {
      fullName: field("fullName"),
      email: field("email"),
      phone: field("phone"),
      address: field("address"),
      source: field("source"),
      status,
      notes: field("notes"),
    });

    if (result.error) {
      toast.error("Could not save changes", { description: result.error });
      setSaving(false);
      return;
    }

    toast.success("Client updated");
    router.push(`/clients/${clientId}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Client
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Edit Client</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="full-name" label="Full Name">
              <Input
                id="full-name"
                name="fullName"
                defaultValue={initial.fullName}
                required
              />
            </Field>
            <Field id="status" label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="email" label="Email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initial.email}
              />
            </Field>
            <Field id="phone" label="Phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={initial.phone}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="address" label="Address">
                <Input
                  id="address"
                  name="address"
                  defaultValue={initial.address}
                />
              </Field>
            </div>
            <Field id="source" label="Source">
              <Input
                id="source"
                name="source"
                placeholder="e.g. Referral, Website"
                defaultValue={initial.source}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="notes" label="Notes">
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={initial.notes}
                  placeholder="Background, preferences, anything worth remembering..."
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
