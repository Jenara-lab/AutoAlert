# Database Design

Use UUID primary keys, `timestamptz` audit columns, `numeric(12,2)` for money, and `date` for business dates.

## Tables

| Table | Purpose | Important fields |
|---|---|---|
| `profiles` | Application users | `id`, `full_name`, `phone`, `role`, preferences. |
| `vehicles` | Owner vehicles | `owner_id`, plate, make, model, year, VIN, mileage, fuel type. |
| `workshops` | Mechanic-owned public workshops | `mechanic_id`, name, address, phone, manager. |
| `vehicle_workshops` | Vehicle–workshop authorization link | `vehicle_id`, `workshop_id`, `active`. |
| `mileage_logs` | Mileage history | vehicle, recorder, mileage, date. |
| `maintenance_records` | Services and repairs | vehicle, workshop, type, mileage, costs, next service. |
| `operating_expenses` | Fuel, insurance, registration | vehicle, type, amount, due/fuel fields. |
| `alerts` | In-app and delivery tracking | recipient, vehicle, source record, kind, status. |

## Enums

`user_role`: `owner`, `mechanic`.

`maintenance_type`: `oil_change`, `filter_change`, `brake_change`, `tire_change`, `battery_change`, `tune_up`, `general_repair`.

`operating_expense_type`: `fuel`, `insurance`, `registration`.

`alert_kind`: `maintenance_date`, `maintenance_mileage`, `insurance_expiry`, `registration_expiry`.

## Essential constraints

- `vehicles(owner_id, normalized_plate)` unique.
- VIN unique when not null.
- All money >= 0; operating expense amount > 0.
- `current_mileage`, service mileage, and log mileage >= 0.
- `vehicle_workshops(vehicle_id, workshop_id)` unique.
- A trigger validates mechanic/workshop ownership and active vehicle link.

