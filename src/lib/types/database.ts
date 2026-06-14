// Database types matching supabase/migrations/20260611000000_initial_schema.sql.
// Regenerate with `npx supabase gen types typescript` once the project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type ClientRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CaseRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  practice_area: string | null;
  case_number: string | null;
  court_name: string | null;
  court_number: string | null;
  judge_name: string | null;
  opposing_party: string | null;
  opposing_attorney: string | null;
  state_attorney: string | null;
  state_attorney_phone: string | null;
  charge: string | null;
  insurance_company: string | null;
  insurance_agent_phone: string | null;
  status: string;
  filed_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type CaseEventRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  client_id: string | null;
  title: string;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type DocumentRow = {
  id: string;
  user_id: string;
  case_id: string;
  client_id: string | null;
  folder_id: string | null;
  file_name: string;
  file_url: string | null;
  file_path: string | null;
  file_type: string | null;
  document_type: string | null;
  uploaded_at: string;
  created_at: string;
}

export type DocumentFolderRow = {
  id: string;
  user_id: string;
  case_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export type NoteRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  client_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export type ContactRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Insert types: generated columns (id, timestamps) and columns with database
// defaults (status, priority, event_type) are optional.
type InsertOf<Row, Defaulted extends keyof Row = never> = Omit<
  Row,
  "id" | "created_at" | "updated_at" | "uploaded_at" | Defaulted
> &
  Partial<Pick<Row, Extract<"id" | "created_at" | "updated_at" | "uploaded_at" | Defaulted, keyof Row>>>;

type TableOf<Row extends Record<string, unknown>, Defaulted extends keyof Row & string = never> = {
  Row: Row;
  Insert: InsertOf<Row, Defaulted>;
  Update: Partial<Row>;
  Relationships: Relationship[];
}

export type Database = {
  public: {
    Tables: {
      clients: TableOf<ClientRow, "status">;
      cases: TableOf<CaseRow, "status">;
      case_events: TableOf<CaseEventRow, "event_type">;
      tasks: TableOf<TaskRow, "priority" | "status">;
      document_folders: TableOf<DocumentFolderRow>;
      documents: TableOf<DocumentRow>;
      notes: TableOf<NoteRow>;
      contacts: TableOf<ContactRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
