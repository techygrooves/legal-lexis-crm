import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { TasksView, type CaseOption, type TaskItem } from "./tasks-view";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tasks, error }, { data: cases }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, case_id, due_date, status")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("cases")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(`Failed to load tasks: ${error.message}`);
  }

  const caseTitles = new Map((cases ?? []).map((c) => [c.id, c.title]));

  const items: TaskItem[] = (tasks ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    caseTitle: row.case_id ? (caseTitles.get(row.case_id) ?? "") : "",
    dueDate: row.due_date,
    completed: row.status === "completed",
  }));

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return <TasksView tasks={items} cases={caseOptions} />;
}
