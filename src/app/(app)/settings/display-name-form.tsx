"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim() },
    });

    setSaving(false);
    if (error) {
      toast.error("Could not save name", { description: error.message });
      return;
    }
    toast.success("Display name updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Name</CardTitle>
        <CardDescription>
          Shown in the sidebar in place of &ldquo;Solo Attorney&rdquo;. Leave
          blank to show the default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name">Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. David Hoffman"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
