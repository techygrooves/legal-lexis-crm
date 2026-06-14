-- Adds prosecution and insurance fields to the cases table.
-- Idempotent: safe to run on an existing database that was created from the
-- original initial_schema migration. All columns are nullable text.

alter table public.cases
  add column if not exists state_attorney text,
  add column if not exists state_attorney_phone text,
  add column if not exists charge text,
  add column if not exists insurance_company text,
  add column if not exists insurance_agent_phone text;
