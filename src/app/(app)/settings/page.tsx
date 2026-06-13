import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accountRows: [string, string][] = [
    ["Email", user.email ?? "—"],
    [
      "Account created",
      user.created_at
        ? format(parseISO(user.created_at), "MMMM d, yyyy")
        : "—",
    ],
    [
      "Last signed in",
      user.last_sign_in_at
        ? format(parseISO(user.last_sign_in_at), "MMMM d, yyyy 'at' h:mm a")
        : "—",
    ],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            The signed-in attorney account for this practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="space-y-3">
            {accountRows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-3 border-b pb-2 text-sm last:border-b-0"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="pt-1 text-xs text-muted-foreground">
            User ID: <span className="font-mono">{user.id}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile &amp; Preferences</CardTitle>
          <CardDescription>
            Editable firm name, default court, and time zone will be added in a
            later update. Your sign-in email above is your account identity.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
