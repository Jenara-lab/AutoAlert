import { z } from "zod";

const plateRegex = /^[A-Z0-9\- ]+$/;

export const createVehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, "Ingresa la placa.")
    .max(20)
    .regex(plateRegex, "Formato de placa inválido.")
    .transform((v) => v.replace(/\s+/g, " ").trim()),
  make: z.string().trim().min(1, "Ingresa la marca.").max(80),
  model: z.string().trim().min(1, "Ingresa el modelo.").max(80),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Año inválido.")
    .max(new Date().getFullYear() + 1, "Año inválido."),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .max(17, "VIN máx. 17 caracteres.")
    .optional()
    .or(z.literal("")),
  fuelType: z.string().trim().min(1, "Selecciona el tipo de combustible.").max(30),
  currentMileage: z.coerce
    .number()
    .int()
    .min(0, "El kilometraje no puede ser negativo.")
    .optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleValues = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleValues = z.infer<typeof updateVehicleSchema>;
