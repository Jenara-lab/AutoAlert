# Roles and Permissions

## Owner

- Full CRUD for their profile, vehicles, mileage, own maintenance, and operating expenses.
- Can browse active public workshops and link their vehicle to one or more workshops.
- Can read records created by linked workshops for their vehicle.
- Receives and manages alerts for their vehicles.

## Mechanic

- Full CRUD for their own workshops.
- Can read only vehicle details linked to their workshop.
- Can create/edit/delete only records created through their own workshop.
- Must select an owned workshop when registering maintenance.

## Public / authenticated access

- Visitors may see only marketing/auth pages.
- Authenticated users can read basic details of active workshops.
- No user can read another owner’s private expense or mileage records without an authorized relationship.

