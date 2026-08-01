# AutoAlert

## Repository state

Pre-implementation. The `docs/` folder is the complete implementation contract. No source code, build scripts, or CI exist yet.

## Reading order

Read docs in numbered sequence. Start with `docs/00-README.md`, then 01–05 for core decisions, then remaining docs as needed for specific features.

## Critical constraints

- **RLS is the authorization boundary.** Never rely on UI hiding for permissions. Every mutation must verify ownership server-side.
- **Mileage cannot decrease** below the latest known vehicle mileage in the MVP.
- **Operating expenses** = fuel, insurance, registration only. Maintenance costs stay as service records.
- **No uploads, payment, chat, booking, or inventory** in MVP.
- **Spanish-language UI** with red/black/white design system.
- **Supabase service role key** must never reach the browser. Use `NEXT_PUBLIC_` prefix only for safe values.
- **Plates are normalized** (trimmed, uppercased). VIN is unique when not null.
- **Alerts deduplicated** per event + recipient + channel.

## Tech stack

Next.js App Router, TypeScript strict, Tailwind CSS, React Hook Form + Zod, Supabase (PostgreSQL, Auth, RLS), Vercel, UltraMsg (optional WhatsApp via Supabase Edge Function).

## Folder structure

```
src/app/          — Next.js routes, grouped by (auth) and (app) layouts
src/components/   — ui/, vehicles/, maintenance/, expenses/, history/, reports/
src/lib/          — supabase/, validations/, permissions/, alerts/, utils/
src/types/
supabase/migrations/
supabase/seed.sql
docs/             — implementation contract (source of truth)
```

## API conventions

- Return 400 (validation), 401 (no session), 403 (no permission), 404 (missing), 409 (mileage conflict), 500 (unexpected).
- Validate every input with Zod.
- Use database views or server aggregations for reports.

## Implementation order

Follow `docs/23-SPRINTS.md`: Foundation → Core records → Services/expenses → Value/polish.
