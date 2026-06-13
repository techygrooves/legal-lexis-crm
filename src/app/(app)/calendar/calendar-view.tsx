"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { CalendarPreview } from "@/components/calendar-preview";
import { Button } from "@/components/ui/button";
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
import type { CalendarEvent } from "@/lib/mock-data";
import { createEvent } from "./actions";

export interface CaseOption {
  id: string;
  title: string;
}

const NO_CASE = "none";
const eventTypes = ["hearing", "meeting", "deadline", "conference"];

export function CalendarView({
  events,
  cases,
  initialMonth,
  today,
}: {
  events: CalendarEvent[];
  cases: CaseOption[];
  initialMonth: string; // yyyy-MM-dd (first of month)
  today: string; // yyyy-MM-dd
}) {
  const [month, setMonth] = useState(() => new Date(`${initialMonth}T00:00:00`));
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState("hearing");
  const [caseId, setCaseId] = useState(NO_CASE);

  const todayDate = new Date(`${today}T00:00:00`);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const field = (name: string) => (formData.get(name) as string) ?? "";

    const result = await createEvent({
      title: field("title"),
      eventType,
      eventDate: field("eventDate"),
      startTime: field("startTime"),
      endTime: field("endTime"),
      location: field("location"),
      caseId: caseId === NO_CASE ? "" : caseId,
    });

    setSaving(false);
    if (result.error) {
      toast.error("Could not create event", { description: result.error });
      return;
    }
    toast.success("Event created");
    setAddOpen(false);
    setEventType("hearing");
    setCaseId(NO_CASE);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  name="title"
                  placeholder="e.g. Status Hearing"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="event-type">Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger id="event-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-date">Date</Label>
                  <Input id="event-date" name="eventDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-start">Start Time</Label>
                  <Input id="event-start" name="startTime" type="time" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="event-end">End Time</Label>
                  <Input id="event-end" name="endTime" type="time" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  name="location"
                  placeholder="e.g. Courtroom 3B"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-case">Case (optional)</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger id="event-case" className="w-full">
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
                  Create Event
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonth(new Date(`${today.slice(0, 7)}-01T00:00:00`))}
        >
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

      <CalendarPreview month={month} events={events} today={todayDate} />
    </div>
  );
}
