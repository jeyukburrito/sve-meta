# Deployment

## Recommended Stack
- Hosting: `Vercel`
- Database/Auth: `Supabase`
- ORM: `Prisma`

This app is already structured for `Next.js + Supabase + Vercel`, so the shortest path is to deploy the `webapp/` directory as a separate Vercel project.

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

Use the same values as local development. Keep `DATABASE_URL` on the Supabase IPv4 session pooler (`:5432`).

## Vercel Setup
1. Import the repository in Vercel.
2. Set the root directory to `webapp`.
3. Add all required environment variables for Production and Preview.
4. Deploy once to get the production URL.

## Supabase Setup
1. Add the Vercel production URL to `Authentication > URL Configuration > Site URL`.
2. Add `https://YOUR_DOMAIN/auth/callback` to Redirect URLs.
3. If Google login is enabled, add the same URL to the Google OAuth client.

## Database Steps
Run Prisma migration from a machine that can reach Supabase:

```bash
cd /home/oo/work/sve_meta/webapp
npm run prisma:migrate -- --name your_change_name
```

If the production database already matches the schema, prefer `prisma migrate deploy` in CI or a controlled terminal session.

## Verify After Deploy
- Login works on the production URL
- `/matches/new` saves records
- `/matches` filters records
- `CSV 내보내기` downloads a file
- `/dashboard` loads stats without auth or Prisma errors
