"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export interface MutationResult {
  error?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export interface CreateTaskPayload {
  title: string;
  dueDate: string;
  priority: string;
  caseId: string;
}

export async function createTask(
  payload: CreateTaskPayload
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!payload.title.trim()) return { error: "Task title is required." };

  let clientId: string | null = null;
  const caseId = payload.caseId || null;
  if (caseId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!caseRow) return { error: "Selected case not found." };
    clientId = caseRow.client_id;
  }

  const insert: TablesInsert<"tasks"> = {
    user_id: user.id,
    case_id: caseId,
    client_id: clientId,
    title: payload.title.trim(),
    description: null,
    due_date: orNull(payload.dueDate),
    priority: payload.priority || "medium",
    status: "pending",
  };

  const { error } = await supabase.from("tasks").insert(insert);
  if (error) return { error: `Could not create task: ${error.message}` };

  revalidatePath("/tasks");
  revalidatePath("/");
  return {};
}

export async function setTaskStatus(
  taskId: string,
  completed: boolean
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("tasks")
    .update({ status: completed ? "completed" : "pending" })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not update task: ${error.message}` };

  revalidatePath("/tasks");
  revalidatePath("/");
  return {};
}

export async function deleteTask(taskId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: `Could not delete task: ${error.message}` };

  revalidatePath("/tasks");
  revalidatePath("/");
  return {};
}
