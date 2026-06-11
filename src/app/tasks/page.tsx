"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { tasks as initialTasks } from "@/lib/mock-data";

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);

  function toggleTask(id: string) {
    setTasks((list) =>
      list.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <Button onClick={() => toast.info("Task creation comes with the database hookup.")}>
          <Plus data-icon="inline-start" />
          Add Task
        </Button>
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
                <label
                  key={task.id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
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
                    <span className="block truncate text-xs text-muted-foreground">
                      {task.caseTitle}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      task.completed ? "text-muted-foreground" : "text-red-500"
                    )}
                  >
                    Due {format(parseISO(task.dueDate), "MMM d")}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
