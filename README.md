# ACAMS

Astral Unified Creative Asset Management System (ACAMS) is a Next.js foundation for the product defined in the PRD. This implementation pass now includes:

- A Next.js App Router shell with protected routes
- Demo-mode login plus real Supabase wiring when env vars are present
- Brand, shared-library, upload, and approvals pages
- Role-aware access helpers and repository-style data loading
- Supabase schema, seed, and Row Level Security policy files

## Structure

- `app/` - App Router pages and shared styling
- `components/` - Dashboard, asset list, shell, and summary UI
- `lib/` - Domain types, demo data, auth helpers, and data access
- `supabase/schema.sql` - Database schema aligned to the PRD
- `supabase/rls.sql` - RLS baseline for brand isolation and shared assets
- `supabase/seed.sql` - Initial brand seed data
- `proxy.ts` - Route protection for demo mode and Supabase sessions

## Next steps

1. Copy `.env.example` to `.env.local` and add Supabase credentials.
2. Run the SQL in `supabase/schema.sql`, `supabase/rls.sql`, and `supabase/seed.sql`.
3. Run the app with `npm run dev`.
4. Sign in through `/login`. Without env vars, use demo mode to validate the flows locally.

## Notes

- The app automatically switches between demo mode and Supabase mode based on the presence of `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Shared-library assets are modeled as `brand_id = null`.
- Cross-brand visibility is modeled through explicit grants and mirrored in the SQL policies.
