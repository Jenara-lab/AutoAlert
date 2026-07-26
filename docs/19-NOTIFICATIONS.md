# Notification Design

## Required in-app alerts

| Source | Trigger | Default lead time |
|---|---|---|
| Maintenance date | `next_service_date` approaching | 7 days |
| Maintenance mileage | current km reaches target minus threshold | 300 km |
| Insurance | due date approaching | 15 days |
| Registration | due date approaching | 15 days |

Users can configure date lead time and mileage threshold in Settings. A daily cron job scans eligible records, creates non-duplicate in-app alerts, then attempts configured external channels.

Mileage reminders depend on regular user input. Dashboard should prominently offer “Update mileage” and show a gentle prompt after 30 days without a reading.

