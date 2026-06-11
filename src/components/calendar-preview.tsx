import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { cn } from "@/lib/utils";
import type { CalendarEvent, EventType } from "@/lib/mock-data";

const eventColors: Record<EventType, string> = {
  Hearing:
    "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  Meeting:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Deadline:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  Conference:
    "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function CalendarPreview({
  month,
  events,
  today,
}: {
  month: Date;
  events: CalendarEvent[];
  today?: Date;
}) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));

  const days: Date[] = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameDay(parseISO(event.date), day)
          );
          const inMonth = isSameMonth(day, month);
          const isToday = today && isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-20 border-t border-r p-1.5 first:border-t-0 nth-[-n+7]:border-t-0 nth-[7n]:border-r-0 md:min-h-24",
                !inMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  !inMonth && "text-muted-foreground",
                  isToday && "bg-indigo-600 font-medium text-white"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    title={event.title}
                    className={cn(
                      "truncate rounded border px-1.5 py-0.5 text-[11px] leading-4",
                      eventColors[event.type]
                    )}
                  >
                    {event.startTime && (
                      <span className="font-medium">{event.startTime} </span>
                    )}
                    {event.type}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
