import { z } from "zod";

export const createMileageSchema = z.object({
  mileage: z.coerce
    .number()
    .int()
    .min(0, "El kilometraje no puede ser negativo."),
  date: z.string().min(1, "Selecciona la fecha."),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateMileageValues = z.infer<typeof createMileageSchema>;
