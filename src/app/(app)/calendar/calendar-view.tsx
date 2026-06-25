"use client";

import { addMonths, format, subMonths } from "date-fns";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
import { createEvent, deleteEvent, updateEvent } from "./actions";

export interface CaseOption {
  id: string;
  title: string;
}

export interface EditableEvent {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  caseId: string;
}

const NO_CASE = "none";
const eventTypes = ["hearing", "meeting", "deadline", "conference"];

interface EventDraft {
  id: string | null; // null = adding a new event
  title: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  caseId: string; // real id, or NO_CASE
}

function emptyDraft(): EventDraft {
  return {
    id: null,
    title: "",
    eventType: "hearing",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    caseId: NO_CASE,
  };
}

export function CalendarView({
  events,
  editableEvents,
  cases,
  initialMonth,
  today,
}: {
  events: CalendarEvent[];
  editableEvents: EditableEvent[];
  cases: CaseOption[];
  initialMonth: string; // yyyy-MM-dd (first of month)
  today: string; // yyyy-MM-dd
}) {
  const [month, setMonth] = useState(() => new Date(`${initialMonth}T00:00:00`));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const todayDate = new Date(`${today}T00:00:00`);
  const isEditing = draft.id !== null;

  function openAdd() {
    setDraft(emptyDraft());
    setConfirmingDelete(false);
    setOpen(true);
  }

  function openEdit(eventId: string) {
    const event = editableEvents.find((e) => e.id === eventId);
    if (!event) return;
    setDraft({
      id: event.id,
      title: event.title,
      eventType: event.eventType || "hearing",
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      caseId: event.caseId || NO_CASE,
    });
    setConfirmingDelete(false);
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setConfirmingDelete(false);
  }

  function setField<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = {
      title: draft.title,
      eventType: draft.eventType,
      eventDate: draft.eventDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      location: draft.location,
      caseId: draft.caseId === NO_CASE ? "" : draft.caseId,
    };

    const result = draft.id
      ? await updateEvent(draft.id, payload)
      : await createEvent(payload);

    setSaving(false);
    if (result.error) {
      toast.error(
        draft.id ? "Could not save changes" : "Could not create event",
        { description: result.error }
      );
      return;
    }
    toast.success(draft.id ? "Event updated" : "Event created");
    setOpen(false);
  }

  async function handleDelete() {
    if (!draft.id || deleting) return;
    setDeleting(true);
    const result = await deleteEvent(draft.id);
    setDeleting(false);
    if (result.error) {
      toast.error("Could not delete event", { description: result.error });
      return;
    }
    toast.success("Event deleted");
    setOpen(false);
  }

  const selectedCaseId = draft.caseId === NO_CASE ? "" : draft.caseId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <Button onClick={openAdd}>
          <Plus data-icon="inline-start" />
          Add Event
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={draft.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Status Hearing"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-type">Type</Label>
                <Select
                  value={draft.eventType}
                  onValueChange={(value) => setField("eventType", value)}
                >
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
                <Input
                  id="event-date"
                  type="date"
                  value={draft.eventDate}
                  onChange={(e) => setField("eventDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-start">Start Time</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end">End Time</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={draft.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Courtroom 3B"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-case">Case (optional)</Label>
              <Select
                value={draft.caseId}
                onValueChange={(value) => setField("caseId", value)}
              >
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
              {isEditing && selectedCaseId && (
                <Link
                  href={`/cases/${selectedCaseId}`}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <ExternalLink className="size-3" />
                  Open case
                </Link>
              )}
            </div>

            {confirmingDelete ? (
              <DialogFooter>
                <span className="mr-auto self-center text-sm text-muted-foreground">
                  Delete this event?
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Keep
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting && (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="mr-auto"
                    disabled={saving}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </Button>
                )}
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  )}
                  {isEditing ? "Save Changes" : "Create Event"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

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

      <p className="text-sm text-muted-foreground">
        Click any event to edit or delete it.
      </p>

      <CalendarPreview
        month={month}
        events={events}
        today={todayDate}
        onEventClick={openEdit}
      />
    </div>
  );
}
