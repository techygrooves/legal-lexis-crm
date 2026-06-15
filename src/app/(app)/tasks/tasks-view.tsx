"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTask, deleteTask, setTaskStatus } from "./actions";

export interface TaskItem {
  id: string;
  title: string;
  caseId: string | null;
  caseTitle: string;
  dueDate: string | null;
  completed: boolean;
}

export interface CaseOption {
  id: string;
  title: string;
}

const NO_CASE = "none";

export function TasksView({
  tasks,
  cases,
}: {
  tasks: TaskItem[];
  cases: CaseOption[];
}) {
  const [pendingTransition, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState("medium");
  const [caseId, setCaseId] = useState(NO_CASE);

  function toggle(id: string, completed: boolean) {
    startTransition(async () => {
      const result = await setTaskStatus(id, completed);
      if (result.error) toast.error("Could not update", { description: result.error });
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTask(id);
      if (result.error) toast.error("Could not delete", { description: result.error });
      else toast.success("Task deleted");
    });
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const result = await createTask({
      title: (formData.get("title") as string) ?? "",
      dueDate: (formData.get("dueDate") as string) ?? "",
      priority,
      caseId: caseId === NO_CASE ? "" : caseId,
    });

    setSaving(false);
    if (result.error) {
      toast.error("Could not create task", { description: result.error });
      return;
    }
    toast.success("Task created");
    setAddOpen(false);
    setPriority("medium");
    setCaseId(NO_CASE);
  }

  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-title">Task</Label>
                <Input
                  id="task-title"
                  name="title"
                  placeholder="e.g. Draft engagement letter"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input id="task-due" name="dueDate" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="task-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-case">Case (optional)</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger id="task-case" className="w-full">
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
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {[
        { title: `Pending (${pending.length})`, items: pending },
        { title: `Completed (${completed.length})`, items: completed },
      ].map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {section.title}
          </h2>
          <Card>
            <CardContent className="divide-y px-0 py-0">
              {section.items.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nothing here.
                </p>
              )}
              {section.items.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={task.completed}
                    disabled={pendingTransition}
                    onCheckedChange={(value) => toggle(task.id, value === true)}
                    aria-label={`Mark "${task.title}" ${task.completed ? "pending" : "complete"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        task.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </span>
                    {task.caseTitle &&
                      (task.caseId ? (
                        <Link
                          href={`/cases/${task.caseId}`}
                          className="block truncate text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {task.caseTitle}
                        </Link>
                      ) : (
                        <span className="block truncate text-xs text-muted-foreground">
                          {task.caseTitle}
                        </span>
                      ))}
                  </span>
                  {task.dueDate && (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        task.completed ? "text-muted-foreground" : "text-red-500"
                      )}
                    >
                      Due {format(parseISO(task.dueDate), "MMM d")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(task.id)}
                    disabled={pendingTransition}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete task</span>
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
