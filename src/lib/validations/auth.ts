import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Ingresa un correo electrónico válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo.").max(120),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["owner", "mechanic"], { message: "Selecciona un tipo de cuenta." }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
