import { z } from "zod";

export const createWorkshopSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre del taller.").max(120),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  manager: z.string().trim().max(120).optional().or(z.literal("")),
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

export type CreateWorkshopValues = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopValues = z.infer<typeof updateWorkshopSchema>;
