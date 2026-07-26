# Folder Structure

```text
src/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (app)/dashboard/page.tsx
    (app)/vehicles/
    (app)/history/page.tsx
    (app)/workshops/
    (app)/alerts/page.tsx
    (app)/reports/page.tsx
    (app)/settings/page.tsx
    api/
  components/
    ui/ vehicles/ maintenance/ expenses/ history/ reports/
  lib/
    supabase/ validations/ permissions/ alerts/ utils/
  types/
supabase/
  migrations/
  seed.sql
docs/
```

Keep feature logic close to its UI and place shared database/auth helpers in `lib`. Do not place secrets in `NEXT_PUBLIC_` variables.

