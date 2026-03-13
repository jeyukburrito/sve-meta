# Supabase Setup Guide

## Goal
Connect the `webapp/` project to an existing Supabase project safely, then enable Google login, Prisma migrations, RLS, and local verification.

## 1. Collect Project Credentials
In the Supabase Dashboard:

1. Go to `Settings > API`.
2. Copy:
   - `Project URL`
   - `anon` key
   - `service_role` key
3. Go to `Settings > Database` or the `Connect` dialog.
4. Copy two Postgres connection strings:
   - pooled connection for `DATABASE_URL`
   - direct connection for `DIRECT_URL`

Use the pooled URL for the app runtime and the direct URL for Prisma CLI work. Prisma recommends pooled runtime connections plus a direct URL for migrations.

## 2. Create Local Environment Files
From `webapp/`, create both `.env.local` and `.env`.

Reason:
- Next.js reads `.env.local`
- Prisma CLI reads `.env`

Use [`.env.example`](/home/oo/work/sve_meta/webapp/.env.example) as the template.

Required values:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Security rules:
- Never commit `.env` or `.env.local`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code
- Only `NEXT_PUBLIC_*` values may be sent to the client

## 3. Configure Redirect URLs in Supabase
In Supabase, open `Authentication > URL Configuration`.

Set:
- `Site URL`: `http://localhost:3000` for local-first setup
- Additional Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - production callback URL later, for example `https://your-domain.com/auth/callback`

Our app uses `redirectTo` and the callback route at `/auth/callback`, so that path must be allowed.

## 4. Configure Google Login
Supabase requires Google OAuth to be configured in Google Auth Platform / Google Cloud first.

### In Supabase
1. Go to `Authentication > Sign In / Providers`.
2. Open `Google`.
3. Copy the Supabase callback URL shown there.
   It looks like:
   `https://<project-ref>.supabase.co/auth/v1/callback`

### In Google Cloud
1. Create an OAuth client with type `Web application`.
2. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - your production origin later
3. Add authorized redirect URI:
   - the Supabase callback URL copied above
4. Save the Google client ID and client secret.

### Back in Supabase
1. Paste the Google client ID and client secret into the Google provider settings.
2. Enable the provider.
3. Save.

## 5. Run Prisma Setup
From `/home/oo/work/sve_meta/webapp`:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Expected result:
- Prisma client generated
- `users`, `decks`, `match_results`, `tags`, `match_result_tags` created
- one local dev user and three sample decks inserted

## 6. Apply RLS Policies
Open Supabase `SQL Editor` and run:

- [rls.sql](/home/oo/work/sve_meta/webapp/supabase/rls.sql)

This enables row-level security so each user can only access records tied to their `user_id`.

## 7. Local Verification
Run:

```bash
npm run dev
```

Then verify:
1. Open `http://localhost:3000/login`
2. Click `Google로 로그인`
3. Confirm redirect succeeds
4. Visit `/dashboard`, `/matches`, `/settings`
5. Confirm unauthenticated access redirects to `/login`

## 8. QA Checklist
- `.env` and `.env.local` exist and are not committed
- Google provider is enabled in Supabase
- `http://localhost:3000/auth/callback` is in redirect URLs
- Prisma migration completed successfully
- RLS SQL applied successfully
- Login works
- Protected pages redirect correctly when signed out

## Notes
- `service_role` should only be used in server-only admin code.
- The current app uses cookie-based SSR auth via `@supabase/ssr`.
- Protected pages are forced to dynamic rendering to avoid static leakage.

## References
- Supabase Next.js Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR guide: https://supabase.com/docs/guides/auth/server-side
- Supabase Next.js SSR client setup: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase service role guidance: https://supabase.com/docs/guides/troubleshooting/performing-administration-tasks-on-the-server-side-with-the-servicerole-secret-BYM4Fa
- Prisma + Supabase: https://www.prisma.io/docs/v6/orm/overview/databases/supabase
