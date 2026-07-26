# Navigation Flow

Mobile bottom navigation: **Home**, **Vehicles**, central **Add**, **History**, **More**. Desktop uses the same sections in a sidebar.

```mermaid
flowchart TD
  D[Dashboard] --> V[Vehicles]
  V --> VD[Vehicle Detail]
  VD --> M[Add Maintenance]
  M --> T[Maintenance Type Picker]
  T --> F[Type-specific Form]
  F --> H[History]
  D --> E[Add Operating Expense]
  E --> H
  V --> L[Link Workshop]
  D --> A[Alerts]
  D --> R[Reports]
```

The Add action opens: **Maintenance**, **Operating Expense**, or **Mileage**. Mechanics select an owned workshop before choosing a linked vehicle and maintenance type.

