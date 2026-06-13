# LegalCRM

Private case and client management for a solo attorney practice. Built with
Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to
`/login` until you sign in (Supabase setup below is required first).

## Supabase setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the dashboard, open **Project Settings → API Keys**.
3. Copy the **Project URL** and the **anon (public)** key.

> Never put the `service_role` key in this app or in any `NEXT_PUBLIC_`
> variable. This project uses only the anon key.

### 2. Configure environment variables

Create `.env.local` in the project root (see `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Restart `npm run dev` after changing env vars. On Vercel, add the same two
variables under **Project Settings → Environment Variables** and redeploy.

### 3. Run the database migration

The schema lives in `supabase/migrations/20260611000000_initial_schema.sql`.

Using the dashboard:

1. Open your project in the Supabase dashboard.
2. Go to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Paste the full contents of the migration file.
5. Click **Run**.
6. Verify under **Table Editor** that `clients`, `cases`, `case_events`,
   `tasks`, `documents`, `notes`, and `contacts` exist.

Or with the Supabase CLI: `supabase db push` after `supabase link`.

> **Note:** Row Level Security is intentionally not enabled yet. Every table
> already has a `user_id` column so RLS policies can be added in a later
> migration. Until RLS is in place, do not store real confidential client
> data in this database.

### 4. Auth settings

Email/password auth is enabled by default in new Supabase projects
(**Authentication → Sign In / Up → Email**). By default, new sign-ups must
confirm their email address before they can sign in. For a quicker solo setup
you can disable **Confirm email** there instead.

Since this CRM is for one attorney, after creating your own account you can
disable further sign-ups (**Authentication → Sign In / Up → Allow new users
to sign up**).

### 5. Storage bucket for documents

Document upload on the case detail page is now live, and requires a bucket plus
storage policies:

1. In the dashboard, go to **Storage → New bucket**, name it `case-documents`,
   and leave it **Private** (do not enable "Public bucket").
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/storage/case-documents-policies.sql`, and **Run**. Uploads and
   downloads will fail against a private bucket until these policies exist.

Files are stored under `<user-id>/<case-id>/<filename>` and served through
short-lived signed URLs. The storage policies scope each user to their own
folder.

> **Important:** This protects stored files, but table-level RLS on the
> `public` schema is still **not** enabled. Until that is added, treat the
> database as not yet hardened for highly sensitive data.

## Auth flow

- `/login` — sign in or sign up with email and password.
- All app pages (`/`, `/clients`, `/cases`, `/cases/new`, `/cases/[id]`,
  `/calendar`, `/tasks`, `/documents`, `/settings`) require a session.
- Logged-out visitors are redirected to `/login`; logged-in visitors hitting
  `/login` are redirected to the dashboard.
- Session handling: `src/proxy.ts` (Next.js 16 proxy, formerly middleware)
  refreshes the Supabase session and enforces redirects on every request, and
  the authenticated layout (`src/app/(app)/layout.tsx`) re-checks the user
  server-side.
- Log out with the button at the bottom of the sidebar.

## Project notes

- Cases, clients, the case detail page, dashboard counts, case documents, and
  Settings (account info) run on real Supabase data. The Calendar, Tasks, and
  standalone Documents pages still render mock data from
  `src/lib/mock-data.ts`.
- Cases can be created (Add Case), edited (`/cases/[id]/edit`), and deleted
  (case detail page). Deleting a case cascades to its events, tasks, notes,
  contacts, and document rows, and removes its stored files.
- Database types: `src/lib/types/database.ts`.
- Supabase clients: `src/lib/supabase/client.ts` (browser),
  `src/lib/supabase/server.ts` (server components), and
  `src/lib/supabase/proxy.ts` (session refresh helper for the proxy).
