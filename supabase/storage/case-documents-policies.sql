-- Storage access policies for the private "case-documents" bucket.
--
-- Run this AFTER creating the bucket (Storage -> New bucket -> name
-- "case-documents", keep it Private). Document upload/download/delete will not
-- work against a private bucket until these policies exist.
--
-- Each authenticated user is scoped to files inside a folder named after their
-- own user id (the first path segment, e.g. "<user-id>/<case-id>/<folder>/<file>").
-- This is storage-level access control only. Table-level RLS on the public
-- schema (clients, cases, ...) is a separate step added later.
--
-- Supabase enables RLS on storage.objects by default, so adding these policies
-- is required. Re-running this file is safe because existing policies are
-- dropped before being recreated.

drop policy if exists "case-documents read own" on storage.objects;
drop policy if exists "case-documents insert own" on storage.objects;
drop policy if exists "case-documents update own" on storage.objects;
drop policy if exists "case-documents delete own" on storage.objects;

create policy "case-documents read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "case-documents insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "case-documents update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "case-documents delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
