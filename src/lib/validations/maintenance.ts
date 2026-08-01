import { z } from "zod";

export const maintenanceTypeEnum = z.enum([
  "oil_change",
  "filter_change",
  "brake_change",
  "tire_change",
  "battery_change",
  "tune_up",
  "general_repair",
]);

export const createMaintenanceSchema = z
  .object({
    vehicleId: z.string().uuid("Selecciona un vehículo."),
    workshopId: z.string().uuid().optional().or(z.literal("")),
    type: maintenanceTypeEnum,
    mileage: z.coerce
      .number()
      .int()
      .min(0, "El kilometraje no puede ser negativo."),
    serviceDate: z.string().min(1, "Selecciona la fecha del servicio."),
    description: z.string().trim().max(1000).optional().or(z.literal("")),

    costTotal: z.coerce.number().min(0).optional(),
    costLabor: z.coerce.number().min(0).optional(),
    costParts: z.coerce.number().min(0).optional(),

    nextServiceDate: z.string().optional().or(z.literal("")),
    nextServiceMileage: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.coerce.number().int().min(0).optional(),
      )
      .transform((val) => (val === 0 ? undefined : val)),
  })
  .refine(
    (data) => {
      const hasLabor = data.costLabor !== undefined && data.costLabor > 0;
      const hasParts = data.costParts !== undefined && data.costParts > 0;
      if (hasLabor || hasParts) {
        const labor = data.costLabor ?? 0;
        const parts = data.costParts ?? 0;
        const expectedTotal = labor + parts;
        if (data.costTotal !== undefined && data.costTotal !== expectedTotal) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Si indicas mano de obra o repuestos, el total debe ser igual a su suma.",
      path: ["costTotal"],
    },
  );

export const maintenanceFilterSchema = z.object({
  vehicleId: z.string().optional(),
  type: maintenanceTypeEnum.optional(),
  workshopId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateMaintenanceValues = z.infer<typeof createMaintenanceSchema>;
export type MaintenanceFilterValues = z.infer<typeof maintenanceFilterSchema>;
