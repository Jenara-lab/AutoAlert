# CallMeBot Integration

CallMeBot is an optional WhatsApp notification channel, not a required dependency for the prototype.

## Rules

- Store the API key only in server-side environment variables or protected user configuration; never send it to the browser.
- The user must opt in and provide/authorize a compatible phone number.
- Send from the cron/Route Handler after the in-app alert has been saved.
- Record `sent`, `failed`, and error detail in `alerts`.
- If CallMeBot fails, retain the in-app alert and display delivery status; do not fail the user’s maintenance registration.

Start with in-app alerts. Add email/WhatsApp only after the core demo works.

