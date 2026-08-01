"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/validations/auth";

type ActionResult = { error: string } | undefined;

export async function signIn(values: SignInValues): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: "Correo o contraseña incorrectos." };
  } catch {
    return { error: "Configura Supabase en .env.local antes de iniciar sesión." };
  }

  redirect("/dashboard");
}

export async function signUp(values: SignUpValues): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone || null,
          role: parsed.data.role,
        },
      },
    });
    if (error) return { error: error.message };
  } catch {
    return { error: "Configura Supabase en .env.local antes de crear una cuenta." };
  }

  redirect("/login?message=Revisa tu correo para confirmar tu cuenta.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
