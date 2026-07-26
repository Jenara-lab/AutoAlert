# Entity Relationship Diagram

```mermaid
erDiagram
  PROFILES ||--o{ VEHICLES : owns
  PROFILES ||--o{ WORKSHOPS : manages
  VEHICLES ||--o{ VEHICLE_WORKSHOPS : connects
  WORKSHOPS ||--o{ VEHICLE_WORKSHOPS : serves
  VEHICLES ||--o{ MILEAGE_LOGS : records
  PROFILES ||--o{ MILEAGE_LOGS : creates
  VEHICLES ||--o{ MAINTENANCE_RECORDS : receives
  WORKSHOPS ||--o{ MAINTENANCE_RECORDS : performs
  PROFILES ||--o{ MAINTENANCE_RECORDS : creates
  VEHICLES ||--o{ OPERATING_EXPENSES : has
  PROFILES ||--o{ ALERTS : receives
  VEHICLES ||--o{ ALERTS : concerns
```

## Relationship rationale

The many-to-many `vehicle_workshops` table is central: it models the owner choosing a workshop and authorizes workshop–owner record sharing. It is not merely a directory favorite.

