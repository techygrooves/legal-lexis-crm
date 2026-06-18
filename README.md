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

**Multiple users (separate accounts):** each account gets its own private data
(everything is scoped per user). To let more than one person use the app, keep
**Authentication → Sign In / Up → Allow new users to sign up** enabled — anyone
can then create their own login at `/login`. To lock it down to a single user,
disable that toggle after creating your account.

**URL configuration (do this once):** under **Authentication → URL
Configuration**, set the **Site URL** to your deployed app (e.g.
`https://YOUR-PROJECT.vercel.app`, **not** `http://localhost:3000` — pointing it
at localhost is what makes confirmation links open a blank localhost tab), and
add these to **Redirect URLs**:

- `https://YOUR-DOMAIN/auth/callback` and `https://YOUR-DOMAIN/auth/confirm`
- `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/confirm`

**Password reset:** the "Forgot password?" flow (`/forgot-password`) uses
`/auth/callback`. No further config beyond the redirect URLs above.

**Email confirmation:** so the confirmation link lands on a friendly "email
confirmed — sign in" page instead of a bare redirect, edit the **Confirm signup**
template (**Authentication → Emails → Templates**) so the button link is:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```

The `/auth/confirm` route verifies the address, signs the user out, and sends
them to `/login` with a confirmation banner so they sign in themselves.

**"Email rate limit exceeded" on sign-up:** Supabase's *built-in* email service
is meant only for early testing and caps confirmation emails at a few per hour
(shared across the whole project). Repeated sign-up attempts trip it. Fix it one
of these ways:

- **Turn off confirmation (simplest for a solo practice):** disable
  **Authentication → Sign In / Up → Confirm email**. Sign-ups then work
  instantly with no email sent and no rate limit.
- **Add your own SMTP (keeps confirmation, raises the limit):** under
  **Authentication → Emails → SMTP Settings**, enable custom SMTP and plug in a
  provider (Resend, SendGrid, Postmark, AWS SES, etc.). The per-hour cap is then
  governed by your provider, and you can raise the rate under
  **Authentication → Rate Limits**.
- **Just wait:** the built-in limit resets on a rolling window, so pausing for
  an hour also clears it.

### 5. Storage bucket for documents

Document upload on the case detail page is now live, and requires a bucket plus
storage policies:

1. In the dashboard, go to **Storage → New bucket**, name it `case-documents`,
   and leave it **Private** (do not enable "Public bucket").
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/storage/case-documents-policies.sql`, and **Run**. Uploads and
   downloads will fail against a private bucket until these policies exist.

Files are stored under `<user-id>/<case-id>/<folder-or-root>/<filename>` and
served through short-lived signed URLs. The storage policies scope each user to
their own folder. The app also stores case-specific folder records in the
database so folders can be created and renamed without depending only on
storage paths.

> **Important:** This protects stored files, but table-level RLS on the
> `public` schema is still **not** enabled. Until that is added, treat the
> database as not yet hardened for highly sensitive data.

### 6. Google Calendar sync (optional)

Connecting Google Calendar makes events you create in the CRM also appear on
the user's Google Calendar. Sync is **one-way** for now: the CRM is the source
of truth; Google-only events are not imported back. If the user isn't connected
(or sync fails), the CRM event still saves normally — Calendar sync is
strictly additive.

**1. Create the Google Cloud OAuth client (once, in any Google account you control):**

1. Go to https://console.cloud.google.com → create a project (or reuse one).
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** → User type: **External** →
   keep the app in **Testing** publishing status and add each CRM user's Gmail
   address as a Test user. (Testing mode skips Google verification and allows
   up to 100 test users — enough for a small practice.)
4. **APIs & Services → Credentials → Create OAuth client ID → Web application.**
5. **Authorized redirect URIs:** add
   `https://YOUR-DOMAIN/api/google/calendar/callback`
   (and the matching `http://localhost:3000/api/google/calendar/callback` for
   local dev).
6. Copy the **Client ID** and **Client secret**.

**2. Set environment variables** (Vercel → Project Settings → Environment
Variables, and `.env.local` for local dev):

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/api/google/calendar/callback
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.events
```

**3. Apply the migration** `supabase/migrations/20260615000000_google_calendar.sql`
the same way as the initial schema — paste into the Supabase SQL Editor and
run, or `supabase db push`. This creates `google_calendar_tokens` and adds the
`google_event_id` column to `case_events`.

**4. Connect each user:** sign in to the CRM → **Settings → Google Calendar →
Connect**. The user grants access on Google's consent screen and lands back on
Settings with a "connected" banner. From then on, every new event created in
the CRM is mirrored to their Google Calendar. Disconnecting revokes the token
at Google and removes the row; existing events are left in place.

**Common gotchas**
- `redirect_uri_mismatch`: the URI in Google Cloud Console must match
  `GOOGLE_REDIRECT_URI` exactly, including scheme, host, and the
  `/api/google/calendar/callback` path.
- `access_denied`: the user's Gmail address isn't in the Test users list. Add
  it in **OAuth consent screen → Test users**.
- "Google didn't return a refresh token": Google only issues one on first
  consent. Have the user visit https://myaccount.google.com/permissions,
  remove the app, and click **Connect** again.

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

- Cases, clients, the case detail page, dashboard counts, case documents,
  Calendar, Tasks, standalone Documents, and Settings (account info) run on
  real Supabase data.
- Cases can be created (Add Case), edited (`/cases/[id]/edit`), and deleted
  (case detail page). Deleting a case cascades to its events, tasks, notes,
  contacts, and document rows, and removes its stored files.
- Database types: `src/lib/types/database.ts`.
- Supabase clients: `src/lib/supabase/client.ts` (browser),
  `src/lib/supabase/server.ts` (server components), and
  `src/lib/supabase/proxy.ts` (session refresh helper for the proxy).
