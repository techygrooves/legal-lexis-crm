import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 px-5 py-1">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change && <p className="text-xs text-muted-foreground">{change}</p>}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
            iconClassName
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
