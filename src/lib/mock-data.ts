export type CaseStatus = "Open" | "Pending" | "Closed";
export type ClientStatus = "Active" | "Inactive";
export type EventType = "Hearing" | "Meeting" | "Deadline" | "Conference";
export type DocumentType = "pdf" | "docx" | "image";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  clientSince: string;
  matters: number;
}

export interface Case {
  id: string;
  title: string;
  clientName: string;
  practiceArea: string;
  caseNumber: string;
  courtName: string;
  courtNumber: string;
  judgeName: string;
  opposingParty: string;
  opposingAttorney: string;
  status: CaseStatus;
  filedDate: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date (yyyy-MM-dd)
  startTime?: string;
  endTime?: string;
  type: EventType;
  location?: string;
  caseId?: string | null;
}

export interface Task {
  id: string;
  title: string;
  caseTitle: string;
  dueDate: string;
  completed: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  caseTitle: string;
  uploadedDate: string;
  type: DocumentType;
}

export const stats = {
  totalClients: { value: 128, change: "+12 this month" },
  openCases: { value: 67, change: "+5 this month" },
  upcomingEvents: { value: 9, change: "Next 7 days" },
  pendingTasks: { value: 23, change: "Due this week" },
};

export const clients: Client[] = [
  { id: "c1", name: "John Smith", email: "john.smith@email.com", phone: "(555) 123-4567", address: "123 Main St, Miami, FL 33101", status: "Active", clientSince: "2023-03-10", matters: 2 },
  { id: "c2", name: "Mary Johnson", email: "mary.t@email.com", phone: "(555) 987-6543", address: "45 Ocean Dr, Miami, FL 33139", status: "Active", clientSince: "2022-11-02", matters: 3 },
  { id: "c3", name: "Robert Davis", email: "robert.davis@email.com", phone: "(555) 456-7890", address: "78 Palm Ave, Coral Gables, FL 33134", status: "Active", clientSince: "2024-01-18", matters: 1 },
  { id: "c4", name: "Patricia Brown", email: "patricia.b@email.com", phone: "(555) 321-0987", address: "9 Sunset Blvd, Miami, FL 33143", status: "Active", clientSince: "2023-07-22", matters: 2 },
  { id: "c5", name: "Michael Wilson", email: "michael.w@email.com", phone: "(555) 654-3210", address: "330 Brickell Ave, Miami, FL 33131", status: "Inactive", clientSince: "2021-05-14", matters: 0 },
  { id: "c6", name: "Linda Garcia", email: "linda.g@email.com", phone: "(555) 789-0123", address: "12 Coral Way, Miami, FL 33145", status: "Active", clientSince: "2024-09-03", matters: 1 },
  { id: "c7", name: "William Martinez", email: "william.m@email.com", phone: "(555) 234-5678", address: "501 NE 1st Ave, Miami, FL 33132", status: "Active", clientSince: "2023-12-12", matters: 2 },
  { id: "c8", name: "Jennifer Taylor", email: "jennifer.t@email.com", phone: "(555) 876-5432", address: "88 Biscayne Blvd, Miami, FL 33132", status: "Inactive", clientSince: "2022-02-28", matters: 0 },
];

export const cases: Case[] = [
  {
    id: "m1",
    title: "Smith v. ABC Corp",
    clientName: "John Smith",
    practiceArea: "Business Litigation",
    caseNumber: "2026-CV-12345",
    courtName: "Florida County Court",
    courtNumber: "11th Judicial Circuit",
    judgeName: "Hon. Maria Sanchez",
    opposingParty: "ABC Corporation",
    opposingAttorney: "Dana Whitfield, Esq.",
    status: "Open",
    filedDate: "2026-03-01",
    notes: "Discovery in progress. Client deposition scheduled.",
  },
  {
    id: "m2",
    title: "Johnson Family Trust",
    clientName: "Mary Johnson",
    practiceArea: "Estate Planning",
    caseNumber: "2026-PR-00871",
    courtName: "Probate Division",
    courtNumber: "Division 02",
    judgeName: "Hon. Carl Reyes",
    opposingParty: "—",
    opposingAttorney: "—",
    status: "Open",
    filedDate: "2026-02-12",
    notes: "Trust amendment drafted, awaiting client review.",
  },
  {
    id: "m3",
    title: "Davis v. State",
    clientName: "Robert Davis",
    practiceArea: "Criminal Defense",
    caseNumber: "2026-CR-04518",
    courtName: "Criminal Division",
    courtNumber: "Division 07",
    judgeName: "Hon. Aisha Brooks",
    opposingParty: "State of Florida",
    opposingAttorney: "Office of the State Attorney",
    status: "Pending",
    filedDate: "2026-04-20",
    notes: "Arraignment complete. Motion to suppress pending.",
  },
  {
    id: "m4",
    title: "Brown Real Estate Dispute",
    clientName: "Patricia Brown",
    practiceArea: "Real Estate",
    caseNumber: "2026-CA-02290",
    courtName: "Civil Division",
    courtNumber: "Division 11",
    judgeName: "Hon. Peter Lindqvist",
    opposingParty: "Sunrise Builders LLC",
    opposingAttorney: "M. Ortega, Esq.",
    status: "Open",
    filedDate: "2026-01-29",
    notes: "Mediation scheduled for next month.",
  },
  {
    id: "m5",
    title: "Garcia Employment Claim",
    clientName: "Linda Garcia",
    practiceArea: "Employment Law",
    caseNumber: "2026-CA-03102",
    courtName: "Civil Division",
    courtNumber: "Division 04",
    judgeName: "Hon. Susan Park",
    opposingParty: "Coastal Logistics Inc.",
    opposingAttorney: "R. Feldman, Esq.",
    status: "Open",
    filedDate: "2026-05-06",
    notes: "EEOC right-to-sue letter received.",
  },
  {
    id: "m6",
    title: "Martinez Contract Review",
    clientName: "William Martinez",
    practiceArea: "Contract Law",
    caseNumber: "2025-CA-09984",
    courtName: "Civil Division",
    courtNumber: "Division 09",
    judgeName: "Hon. Maria Sanchez",
    opposingParty: "Delta Partners",
    opposingAttorney: "T. Nguyen, Esq.",
    status: "Closed",
    filedDate: "2025-10-15",
    notes: "Settled. Final order entered.",
  },
];

export const events: CalendarEvent[] = [
  { id: "e1", title: "Hearing - Smith v. ABC Corp", date: "2026-06-16", startTime: "10:00 AM", endTime: "11:30 AM", type: "Hearing", location: "Courtroom 3B" },
  { id: "e2", title: "Client Meeting - John Doe", date: "2026-06-17", startTime: "2:00 PM", endTime: "3:00 PM", type: "Meeting", location: "Office" },
  { id: "e3", title: "Deadline - Response Filed", date: "2026-06-19", type: "Deadline", location: "Florida County Court" },
  { id: "e4", title: "Pre-trial Conference", date: "2026-06-24", startTime: "2:00 PM", type: "Conference", location: "Courtroom 2A" },
  { id: "e5", title: "Deadline - Discovery Responses", date: "2026-06-05", type: "Deadline" },
  { id: "e6", title: "Mediation - Brown Dispute", date: "2026-06-26", startTime: "9:00 AM", type: "Meeting", location: "Mediation Center" },
  { id: "e7", title: "Status Hearing - Davis v. State", date: "2026-06-30", startTime: "11:00 AM", type: "Hearing", location: "Courtroom 7" },
];

export const tasks: Task[] = [
  { id: "t1", title: "Draft Motion for Summary Judgment", caseTitle: "Smith v. ABC Corp", dueDate: "2026-06-16", completed: false },
  { id: "t2", title: "Review Discovery Responses", caseTitle: "Johnson Family Trust", dueDate: "2026-06-18", completed: false },
  { id: "t3", title: "File Notice of Hearing", caseTitle: "Davis v. State", dueDate: "2026-06-19", completed: false },
  { id: "t4", title: "Update Client on Case Status", caseTitle: "Brown Real Estate Dispute", dueDate: "2026-06-20", completed: false },
  { id: "t5", title: "Prepare Deposition Outline", caseTitle: "Smith v. ABC Corp", dueDate: "2026-06-23", completed: false },
  { id: "t6", title: "Send Engagement Letter", caseTitle: "Garcia Employment Claim", dueDate: "2026-06-12", completed: true },
];

export const documents: DocumentItem[] = [
  { id: "d1", name: "Motion for Summary Judgment.pdf", caseTitle: "Smith v. ABC Corp", uploadedDate: "2026-06-08", type: "pdf" },
  { id: "d2", name: "Client Agreement.docx", caseTitle: "Johnson Family Trust", uploadedDate: "2026-06-07", type: "docx" },
  { id: "d3", name: "Court Order.pdf", caseTitle: "Davis v. State", uploadedDate: "2026-06-06", type: "pdf" },
  { id: "d4", name: "Evidence Photo 1.jpg", caseTitle: "Brown Real Estate Dispute", uploadedDate: "2026-06-05", type: "image" },
  { id: "d5", name: "Settlement Draft.docx", caseTitle: "Martinez Contract Review", uploadedDate: "2026-06-03", type: "docx" },
  { id: "d6", name: "EEOC Letter.pdf", caseTitle: "Garcia Employment Claim", uploadedDate: "2026-06-02", type: "pdf" },
];

export const practiceAreas = [
  "Business Litigation",
  "Estate Planning",
  "Criminal Defense",
  "Real Estate",
  "Employment Law",
  "Contract Law",
  "Family Law",
  "Personal Injury",
  "DUI Defense",
  "Assault and Battery",
  "Injunctions",
  "Expunge and Seal Records",
  "Early Termination of Probation",
  "Security Deposit",
  "Mugshot Removal",
  "Civil",
  "Small Claims",
  "Others",
];

export const attorney = {
  name: "John Attorney",
  role: "Admin",
  email: "hoffmanlegalservice@gmail.com",
  firm: "Hoffman Legal Services",
};
