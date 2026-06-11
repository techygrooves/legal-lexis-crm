-- LegalCRM initial schema
-- Solo-attorney practice: every main table carries user_id referencing
-- auth.users. RLS is intentionally NOT enabled yet — it will be added in a
-- later migration before any confidential data is stored.

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  status text not null default 'active',
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_user_id_idx on public.clients (user_id);
create index clients_status_idx on public.clients (status);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  practice_area text,
  case_number text,
  court_name text,
  court_number text,
  judge_name text,
  opposing_party text,
  opposing_attorney text,
  status text not null default 'open',
  filed_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cases_user_id_idx on public.cases (user_id);
create index cases_client_id_idx on public.cases (client_id);
create index cases_status_idx on public.cases (status);
create index cases_practice_area_idx on public.cases (practice_area);
create index cases_court_name_idx on public.cases (court_name);
create index cases_judge_name_idx on public.cases (judge_name);

create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- case_events
-- ---------------------------------------------------------------------------

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  event_type text not null default 'meeting',
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_events_user_id_idx on public.case_events (user_id);
create index case_events_case_id_idx on public.case_events (case_id);
create index case_events_client_id_idx on public.case_events (client_id);
create index case_events_event_date_idx on public.case_events (event_date);

create trigger case_events_set_updated_at
  before update on public.case_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_case_id_idx on public.tasks (case_id);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  file_name text not null,
  file_url text,
  file_path text,
  file_type text,
  document_type text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index documents_user_id_idx on public.documents (user_id);
create index documents_case_id_idx on public.documents (case_id);
create index documents_client_id_idx on public.documents (client_id);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_case_id_idx on public.notes (case_id);
create index notes_client_id_idx on public.notes (client_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_user_id_idx on public.contacts (user_id);
create index contacts_case_id_idx on public.contacts (case_id);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();
