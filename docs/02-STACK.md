# Technology Stack

| Layer | Choice | Purpose |
|---|---|---|
| Frontend | Next.js App Router + React | Responsive web application. |
| Language | TypeScript strict mode | Safer domain and API contracts. |
| Styling | Tailwind CSS | Fast mobile-first visual system. |
| Forms | React Hook Form + Zod | Accessible forms and server/client validation. |
| Backend | Next.js Route Handlers | Business rules and protected integrations. |
| Database | Supabase PostgreSQL | Relational persistence, views, constraints. |
| Auth | Supabase Auth | Email/password sessions. |
| Authorization | Supabase RLS | Data isolation at database level. |
| Hosting | Vercel | Deployment and scheduled jobs. |
| Messaging | UltraMsg via Supabase Edge Function | Optional WhatsApp delivery. |

Use Supabase SSR helpers for server-side session access. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

