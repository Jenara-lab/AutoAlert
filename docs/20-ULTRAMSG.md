# UltraMsg Integration

UltraMsg is the optional WhatsApp notification channel for the prototype. It is triggered by a Supabase Edge Function.

## Rules

- Store the API token, instance ID and base URL only in server-side environment variables or Supabase Edge Function secrets; never send them to the browser.
- The user must opt in and provide/authorize a compatible phone number.
- The cron/Route Handler calls the Edge Function after the in-app alert has been saved.
- Record `sent`, `failed`, and error detail in `alert_deliveries`.
- If WhatsApp delivery fails, retain the in-app alert and display delivery status; do not fail the user’s maintenance registration.

Start with in-app alerts. Add email/WhatsApp only after the core demo works.
