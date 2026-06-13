import { redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email ?? "";

  return (
    <div className="flex min-h-svh">
      <Sidebar userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-background">
        <Header userEmail={userEmail} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
