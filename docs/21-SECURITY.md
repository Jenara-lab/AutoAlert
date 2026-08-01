# Security

## Authentication and authorization

- Use Supabase Auth sessions and server-side user verification for every mutation.
- Enable RLS for every application table.
- Do not rely on hidden buttons for permission control.

## RLS policy intent

- Owners manage only their profile, vehicles, mileage, expenses, and owner-created service records.
- Mechanics manage only workshops where `mechanic_id = auth.uid()`.
- Mechanics read only vehicles actively linked to one of their workshops.
- Owners read workshop-created records only for linked vehicles.
- Alert rows are readable only by `profile_id = auth.uid()`.

## Data protection

- Use server-only variables for service role, cron secret, and UltraMsg token/instance ID.
- Normalize plates, validate numeric ranges, trim text, and limit notes to 1,000 characters.
- Add rate limiting to auth-adjacent and notification endpoints if time permits.
- Use soft deletes for user-created core entities to preserve history.

