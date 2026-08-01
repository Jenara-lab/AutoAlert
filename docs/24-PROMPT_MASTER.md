# Master Build Prompt

Build **AutoAlert**, a mobile-first vehicle maintenance management MVP using Next.js App Router, React, TypeScript strict mode, Tailwind CSS, Supabase PostgreSQL/Auth/RLS, Next.js Route Handlers, and Vercel. Use all documents in this `docs` folder as the source of truth.

Implement owner and mechanic roles, vehicle CRUD, mileage history, workshops, vehicle–workshop links, seven fixed maintenance types, maintenance costs with total or labor/parts breakdown, and operating expenses named fuel, insurance, and registration. Owners may create maintenance without a workshop; mechanics must select an owned workshop and an actively linked vehicle. Protect all data with Supabase RLS and server-side authorization.

Create a unified history with current-month default and filters for dates, vehicle, maintenance type, workshop, and category. Create reports for monthly costs, costs by vehicle, services, and upcoming events. Implement in-app date, mileage, insurance, and registration alerts; external UltraMsg WhatsApp delivery via a Supabase Edge Function must be optional and server-only.

The UI must be elegant, minimal, mobile-first, Spanish-language, and use a red/black/white design system. Include dashboard, authentication, vehicles, vehicle detail, mileage, maintenance type picker, contextual maintenance forms, operating expense forms, workshops, history, alerts, reports, and settings. Use React Hook Form + Zod, loading/empty/error states, accessible controls, seed data, migrations, and a README with setup instructions. Do not add uploads, payment, chat, booking, inventory, or advanced fleet features.

