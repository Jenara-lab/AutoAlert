import { z } from "zod";

export const expenseTypeEnum = z.enum(["fuel", "insurance", "registration"]);

export const createExpenseSchema = z
  .object({
    vehicleId: z.string().uuid("Selecciona un vehículo."),
    type: expenseTypeEnum,
    amount: z.coerce
      .number()
      .gt(0, "El monto debe ser mayor a 0."),
    date: z.string().min(1, "Selecciona la fecha."),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),

    // Fuel-specific
    fuelQuantity: z.coerce.number().min(0).optional(),
    fuelUnit: z.string().trim().max(10).optional().or(z.literal("")),
    fuelStation: z.string().trim().max(120).optional().or(z.literal("")),
    fuelAddress: z.string().trim().max(255).optional().or(z.literal("")),

    // Insurance / Registration
    dueDate: z.string().optional().or(z.literal("")),
    termMonths: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.coerce.number().int().optional(),
      )
      .transform((val) => (val === 0 ? undefined : val)),
  })
  .refine(
    (data) => {
      if (data.type === "fuel") {
        const hasQty = data.fuelQuantity !== undefined && data.fuelQuantity > 0;
        const hasUnit = data.fuelUnit !== undefined && data.fuelUnit.length > 0;
        return hasQty && hasUnit;
      }
      return true;
    },
    {
      message: "Para combustible, indica la cantidad y la unidad.",
      path: ["fuelQuantity"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "fuel") return true;
      const hasDueDate = data.dueDate && data.dueDate.length > 0;
      const hasTerm =
        data.termMonths !== undefined && [3, 6, 12].includes(data.termMonths);
      return (hasDueDate && !hasTerm) || (!hasDueDate && hasTerm);
    },
    {
      message:
        "Para seguro o revisión, indica una fecha de vencimiento O un plazo (3, 6 o 12 meses), no ambos.",
      path: ["dueDate"],
    },
  );

export const expenseFilterSchema = z.object({
  vehicleId: z.string().optional(),
  type: expenseTypeEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateExpenseValues = z.infer<typeof createExpenseSchema>;
export type ExpenseFilterValues = z.infer<typeof expenseFilterSchema>;
