"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { CalendarPreview } from "@/components/calendar-preview";
import { Button } from "@/components/ui/button";
import { events } from "@/lib/mock-data";

const TODAY = new Date(2026, 5, 11); // mock "today" matching the sample data

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 5, 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <Button onClick={() => toast.info("Event creation comes with the database hookup.")}>
          <Plus data-icon="inline-start" />
          Add Event
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMonth(new Date(2026, 5, 1))}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft />
          <span className="sr-only">Previous month</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight />
          <span className="sr-only">Next month</span>
        </Button>
        <h2 className="text-lg font-medium">{format(month, "MMMM yyyy")}</h2>
      </div>

      <CalendarPreview month={month} events={events} today={TODAY} />
    </div>
  );
}
