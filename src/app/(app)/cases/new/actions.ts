"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export interface CreateCasePayload {
  client: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    source: string;
  };
  caseDetails: {
    title: string;
    practiceArea: string;
    caseNumber: string;
    courtName: string;
    courtNumber: string;
    judgeName: string;
    opposingParty: string;
    opposingAttorney: string;
    stateAttorney: string;
    stateAttorneyPhone: string;
    charge: string;
    insuranceCompany: string;
    insuranceAgentPhone: string;
    status: string;
    filedDate: string;
  };
  events: { title: string; eventType: string; eventDate: string }[];
  tasks: { title: string; dueDate: string }[];
  note: string;
  contacts: { name: string; role: string; email: string; phone: string }[];
}

export interface CreateCaseResult {
  caseId?: string;
  error?: string;
  warning?: string;
}

const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export async function createCase(
  payload: CreateCasePayload
): Promise<CreateCaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a case." };
  }

  if (!payload.client.fullName.trim()) {
    return { error: "Client name is required." };
  }
  if (!payload.caseDetails.title.trim()) {
    return { error: "Case title is required." };
  }

  // 1. Client
  const clientInsert: TablesInsert<"clients"> = {
    user_id: user.id,
    full_name: payload.client.fullName.trim(),
    email: orNull(payload.client.email),
    phone: orNull(payload.client.phone),
    address: orNull(payload.client.address),
    source: orNull(payload.client.source),
    status: "active",
    notes: null,
  };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert(clientInsert)
    .select("id")
    .single();

  if (clientError || !client) {
    return { error: `Could not save client: ${clientError?.message}` };
  }

  // 2. Case linked to the client
  const caseInsert: TablesInsert<"cases"> = {
    user_id: user.id,
    client_id: client.id,
    title: payload.caseDetails.title.trim(),
    practice_area: orNull(payload.caseDetails.practiceArea),
    case_number: orNull(payload.caseDetails.caseNumber),
    court_name: orNull(payload.caseDetails.courtName),
    court_number: orNull(payload.caseDetails.courtNumber),
    judge_name: orNull(payload.caseDetails.judgeName),
    opposing_party: orNull(payload.caseDetails.opposingParty),
    opposing_attorney: orNull(payload.caseDetails.opposingAttorney),
    state_attorney: orNull(payload.caseDetails.stateAttorney),
    state_attorney_phone: orNull(payload.caseDetails.stateAttorneyPhone),
    charge: orNull(payload.caseDetails.charge),
    insurance_company: orNull(payload.caseDetails.insuranceCompany),
    insurance_agent_phone: orNull(payload.caseDetails.insuranceAgentPhone),
    status: payload.caseDetails.status || "open",
    filed_date: orNull(payload.caseDetails.filedDate),
    description: null,
  };

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .insert(caseInsert)
    .select("id")
    .single();

  if (caseError || !caseRow) {
    // Don't leave an orphaned client behind.
    await supabase.from("clients").delete().eq("id", client.id);
    return { error: `Could not save case: ${caseError?.message}` };
  }

  // 3-6. Related records. The case already exists, so failures here are
  // reported as warnings instead of failing the whole submission.
  const warnings: string[] = [];

  const events: TablesInsert<"case_events">[] = payload.events
    .filter((event) => event.title.trim() && event.eventDate)
    .map((event) => ({
      user_id: user.id,
      case_id: caseRow.id,
      client_id: client.id,
      title: event.title.trim(),
      event_type: event.eventType || "meeting",
      event_date: event.eventDate,
      start_time: null,
      end_time: null,
      location: null,
      notes: null,
    }));
  if (events.length > 0) {
    const { error } = await supabase.from("case_events").insert(events);
    if (error) warnings.push(`events (${error.message})`);
  }

  const tasks: TablesInsert<"tasks">[] = payload.tasks
    .filter((task) => task.title.trim())
    .map((task) => ({
      user_id: user.id,
      case_id: caseRow.id,
      client_id: client.id,
      title: task.title.trim(),
      description: null,
      due_date: orNull(task.dueDate),
      priority: "medium",
      status: "pending",
    }));
  if (tasks.length > 0) {
    const { error } = await supabase.from("tasks").insert(tasks);
    if (error) warnings.push(`tasks (${error.message})`);
  }

  if (payload.note.trim()) {
    const note: TablesInsert<"notes"> = {
      user_id: user.id,
      case_id: caseRow.id,
      client_id: client.id,
      note: payload.note.trim(),
    };
    const { error } = await supabase.from("notes").insert(note);
    if (error) warnings.push(`notes (${error.message})`);
  }

  const contacts: TablesInsert<"contacts">[] = payload.contacts
    .filter((contact) => contact.name.trim())
    .map((contact) => ({
      user_id: user.id,
      case_id: caseRow.id,
      name: contact.name.trim(),
      role: orNull(contact.role),
      email: orNull(contact.email),
      phone: orNull(contact.phone),
      notes: null,
    }));
  if (contacts.length > 0) {
    const { error } = await supabase.from("contacts").insert(contacts);
    if (error) warnings.push(`contacts (${error.message})`);
  }

  revalidatePath("/", "layout");

  return {
    caseId: caseRow.id,
    warning:
      warnings.length > 0
        ? `Case created, but some items could not be saved: ${warnings.join(", ")}.`
        : undefined,
  };
}
