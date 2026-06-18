-- Google Calendar sync (one-way: CRM -> Google).
-- Supabase case_events remain the source of truth; google_event_id is just a
-- pointer to the mirrored event on the user's Google Calendar so we can update
-- or delete it later.

-- ---------------------------------------------------------------------------
-- google_calendar_tokens: per-user OAuth tokens
-- ---------------------------------------------------------------------------

create table public.google_calendar_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  calendar_id text not null default 'primary',
  calendar_timezone text,
  google_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger google_calendar_tokens_set_updated_at
  before update on public.google_calendar_tokens
  for each row execute function public.set_updated_at();

-- Match the rest of the schema: RLS is intentionally OFF for now (every row
-- already carries user_id and the app's queries scope by user_id explicitly).
-- Newer Supabase projects auto-enable RLS on new public tables, which would
-- silently block the upsert from /api/google/calendar/callback until policies
-- are added — turn it off here to stay consistent with the other tables.
alter table public.google_calendar_tokens disable row level security;

-- ---------------------------------------------------------------------------
-- case_events: track the mirrored Google event id
-- ---------------------------------------------------------------------------

alter table public.case_events
  add column if not exists google_event_id text;

create index if not exists case_events_google_event_id_idx
  on public.case_events (google_event_id)
  where google_event_id is not null;
