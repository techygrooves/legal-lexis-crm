"use client";

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
import { Separator } from "@/components/ui/separator";
import { attorney } from "@/lib/mock-data";

export default function SettingsPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Settings saved", {
      description: "Mock only — persistence comes with the database hookup.",
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your details as they appear across the app and on documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={attorney.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={attorney.email} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="firm">Firm Name</Label>
              <Input id="firm" defaultValue={attorney.firm} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice Defaults</CardTitle>
            <CardDescription>
              Defaults used when creating new cases and events.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-court">Default Court</Label>
              <Input id="default-court" defaultValue="Florida County Court" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Time Zone</Label>
              <Input id="timezone" defaultValue="America/New_York" />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
