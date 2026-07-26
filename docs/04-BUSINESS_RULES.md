# Business Rules

1. A vehicle has one owner. An owner may have many vehicles.
2. A vehicle may be linked to many workshops; a workshop may serve many vehicles.
3. An owner may create a maintenance record with no workshop, or choose an actively linked workshop.
4. A mechanic must create maintenance records through one of their own workshops; the vehicle must be actively linked to that workshop.
5. Workshop records are visible to the owner only for the linked vehicle. A mechanic cannot browse unrelated owner data.
6. Maintenance needs vehicle, type, service date, mileage, and cost. Labor and parts are optional; if either is supplied, total equals their sum.
7. Mileage cannot be lower than the latest known vehicle mileage in the MVP.
8. Insurance and registration need either an explicit due date or a 3, 6, or 12 month term—not both.
9. Fuel needs date, amount, quantity, and quantity unit. Station and address are optional.
10. The default history range is the current month; users can filter by dates, vehicle, type, or workshop.
11. Alerts are deduplicated per event, recipient, and channel.

`Operating expenses` is the approved term for fuel, insurance, and registration. Maintenance and repair costs remain service records, not operating expenses.

