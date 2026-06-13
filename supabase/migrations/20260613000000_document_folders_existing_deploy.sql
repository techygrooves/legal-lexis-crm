-- Document folders and upload support for already-deployed databases.
--
-- This migration is intentionally idempotent because the initial schema may
-- already include these objects in fresh projects, while existing deployed
-- projects need the table/column additions applied separately.

create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  parent_folder_id uuid references public.document_folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_folders_user_id_idx on public.document_folders (user_id);
create index if not exists document_folders_case_id_idx on public.document_folders (case_id);
create index if not exists document_folders_parent_folder_id_idx on public.document_folders (parent_folder_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'document_folders_set_updated_at'
  ) then
    create trigger document_folders_set_updated_at
      before update on public.document_folders
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.documents
  add column if not exists folder_id uuid references public.document_folders (id) on delete set null;

create index if not exists documents_folder_id_idx on public.documents (folder_id);

-- Only enforce case-required documents when no existing standalone document rows
-- would be broken by the constraint.
do $$
begin
  if not exists (select 1 from public.documents where case_id is null) then
    alter table public.documents alter column case_id set not null;
  end if;
end $$;
