"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createWorkshopSchema,
  type CreateWorkshopValues,
} from "@/lib/validations/workshops";

export function WorkshopForm({
  action,
  defaultValues,
  mode = "create",
}: {
  action: (values: CreateWorkshopValues) => Promise<{ error?: string; data?: string }>;
  defaultValues?: Partial<CreateWorkshopValues>;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string>();

  const form = useForm<CreateWorkshopValues>({
    resolver: zodResolver(createWorkshopSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      manager: "",
      ...defaultValues,
    },
  });

  function onSubmit(values: CreateWorkshopValues) {
    setServerError(undefined);
    setSuccess(false);
    setCreatedId(undefined);
    startTransition(async () => {
      const result = await action(values);
      if (result?.error) {
        setServerError(result.error);
      } else if (result?.data) {
        setSuccess(true);
        setCreatedId(result.data);
        if (mode === "create") {
          form.reset({ name: "", address: "", phone: "", manager: "" });
        }
      } else {
        router.back();
      }
    });
  }

  const input =
    "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Nombre del taller" error={form.formState.errors.name?.message}>
        <input className={input} placeholder="Taller Mecánico ABC" {...form.register("name")} />
      </Field>

      <Field label="Dirección (opcional)" error={form.formState.errors.address?.message}>
        <input className={input} placeholder="Calle Principal #123" {...form.register("address")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono (opcional)" error={form.formState.errors.phone?.message}>
          <input className={input} type="tel" placeholder="+504 9999-0000" {...form.register("phone")} />
        </Field>
        <Field label="Encargado (opcional)" error={form.formState.errors.manager?.message}>
          <input className={input} placeholder="Nombre del encargado" {...form.register("manager")} />
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
          {serverError}
        </p>
      )}

      {success && (
        <div className="rounded-xl bg-[#15803D]/10 p-4 text-sm text-[#15803D]">
          <p className="font-semibold">
            Taller {mode === "create" ? "creado" : "actualizado"} correctamente.
          </p>
          {mode === "create" && createdId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/workshops/${createdId}`}
                className="rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
              >
                Ver taller
              </Link>
              <Link
                href="/workshops"
                className="rounded-lg border border-[#15803D] px-3 py-1.5 text-xs font-semibold text-[#15803D] hover:bg-[#15803D]/10"
              >
                Ir a talleres
              </Link>
            </div>
          )}
        </div>
      )}

      <button
        className="w-full rounded-xl bg-[#d71920] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a80f16] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : mode === "create" ? "Crear taller" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
