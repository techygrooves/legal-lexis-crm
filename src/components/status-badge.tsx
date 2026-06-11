import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Open: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  Inactive: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  Hearing: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  Meeting: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Deadline: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  Conference: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}
