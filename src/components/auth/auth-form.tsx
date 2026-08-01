"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { signIn, signUp } from "@/app/actions/auth";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/validations/auth";

type AuthMode = "login" | "register";
type AuthValues = SignUpValues;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const form = useForm<AuthValues>({
    resolver: zodResolver(isRegister ? signUpSchema : signInSchema) as unknown as Resolver<AuthValues>,
    defaultValues: { fullName: "", email: "", password: "", phone: "", role: "owner" },
  });

  function submit(values: AuthValues) {
    setServerError(undefined);
    startTransition(async () => {
      const result = isRegister
        ? await signUp(values)
        : await signIn(values);
      if (result?.error) setServerError(result.error);
    });
  }

  const inputClass = "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
      {isRegister && (
        <>
          <Field label="Nombre completo" error={form.formState.errors.fullName?.message}>
            <input className={inputClass} autoComplete="name" {...form.register("fullName")} />
          </Field>
          <Field label="Tipo de cuenta" error={form.formState.errors.role?.message}>
            <select className={inputClass} {...form.register("role")}>
              <option value="owner">Propietario</option>
              <option value="mechanic">Mecánico</option>
            </select>
          </Field>
          <Field label="Teléfono (opcional)" error={form.formState.errors.phone?.message}>
            <input className={inputClass} type="tel" autoComplete="tel" {...form.register("phone")} />
          </Field>
        </>
      )}
      <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
        <input className={inputClass} type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Contraseña" error={form.formState.errors.password?.message}>
        <input className={inputClass} type="password" autoComplete={isRegister ? "new-password" : "current-password"} {...form.register("password")} />
      </Field>
      {serverError && <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">{serverError}</p>}
      <button className="w-full rounded-xl bg-[#d71920] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a80f16] disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
        {isPending ? "Procesando…" : isRegister ? "Crear cuenta" : "Iniciar sesión"}
      </button>
      <p className="text-center text-sm text-[#6B7280]">
        {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}{" "}
        <Link className="font-semibold text-[#d71920] hover:underline" href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Inicia sesión" : "Regístrate"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#111111]">{label}{children}{error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}</label>;
}
