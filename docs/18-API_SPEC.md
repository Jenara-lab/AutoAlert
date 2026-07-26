# API Specification

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/vehicles` | Create vehicle. |
| PATCH, DELETE | `/api/vehicles/:id` | Update/soft-delete vehicle. |
| POST | `/api/vehicles/:id/mileage` | Add mileage log. |
| POST, DELETE | `/api/vehicles/:id/workshops` | Link/unlink workshop. |
| GET, POST | `/api/workshops` | List active/create workshop. |
| PATCH, DELETE | `/api/workshops/:id` | Update/deactivate own workshop. |
| GET, POST | `/api/maintenance` | Filter/create service record. |
| PATCH, DELETE | `/api/maintenance/:id` | Update/delete authorized service. |
| GET, POST | `/api/operating-expenses` | Filter/create expense. |
| GET | `/api/history` | Unified filtered timeline. |
| GET | `/api/reports/expenses` | Aggregated report data. |
| GET | `/api/reports/upcoming` | Upcoming events. |
| GET, PATCH | `/api/alerts` | List/mark alerts read. |
| POST | `/api/cron/process-alerts` | Protected scheduled processing. |

Return `400` validation, `401` no session, `403` no permission, `404` missing, `409` mileage conflict, and `500` unexpected errors. Validate every input with Zod.

