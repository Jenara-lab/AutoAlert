"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida."),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export async function changePassword(values: PasswordChangeValues): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = passwordChangeSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const { currentPassword, newPassword } = parsed.data;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.email) {
    return { error: "No se pudo verificar tu identidad." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "La contraseña actual es incorrecta." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: "No se pudo cambiar la contraseña. Intenta de nuevo." };
  }

  return { data: undefined };
}

type ActionResult = { error: string } | { data: undefined };

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Nombre requerido.").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  currencyCode: z.string().length(3, "Código de moneda inválido."),
  emailAlertsEnabled: z.boolean(),
  whatsappAlertsEnabled: z.boolean(),
  dateLeadDays: z.number().int().min(1).max(90),
  mileageThresholdKm: z.number().int().min(50).max(2000),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export async function getProfile(): Promise<
  { data: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    currencyCode: string;
    emailAlertsEnabled: boolean;
    whatsappAlertsEnabled: boolean;
    dateLeadDays: number;
    mileageThresholdKm: number;
  } } | { error: string }
> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, phone, role, currency_code, email_alerts_enabled, whatsapp_alerts_enabled, date_lead_days, mileage_threshold_km"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return { error: "No se pudo cargar el perfil." };

  return {
    data: {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      phone: data.phone,
      role: data.role,
      currencyCode: data.currency_code,
      emailAlertsEnabled: data.email_alerts_enabled,
      whatsappAlertsEnabled: data.whatsapp_alerts_enabled,
      dateLeadDays: data.date_lead_days,
      mileageThresholdKm: data.mileage_threshold_km,
    },
  };
}

export async function updateProfile(values: UpdateProfileValues): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const d = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: d.fullName,
      phone: d.phone || null,
      currency_code: d.currencyCode,
      email_alerts_enabled: d.emailAlertsEnabled,
      whatsapp_alerts_enabled: d.whatsappAlertsEnabled,
      date_lead_days: d.dateLeadDays,
      mileage_threshold_km: d.mileageThresholdKm,
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo actualizar el perfil." };

  revalidatePath("/settings");
  return { data: undefined };
}
