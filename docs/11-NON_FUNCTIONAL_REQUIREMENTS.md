# Non-Functional Requirements

- Mobile-first responsive experience from 320 px upward.
- Strict TypeScript; Zod validation for all mutation payloads.
- Spanish product UI; English technical documentation and code identifiers.
- RLS enabled on every exposed Supabase table.
- Accessible labels, keyboard focus, semantic controls, and minimum 44 px touch targets.
- Currency defaults to HNL but is configurable in profile.
- External notification failures must not prevent data persistence or in-app alerts.
- Use loading, empty, error, and confirmation states for every primary flow.
- Keep the MVP fast: paginate or limit timeline queries and index foreign keys/filter dates.

