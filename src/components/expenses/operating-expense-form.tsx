"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { DateInput } from "@/components/ui/date-input";
import { MoneyInput } from "@/components/ui/money-input";
import { SelectField, TextField, TextareaField } from "@/components/ui/select-field";
import {
  createExpenseSchema,
  type CreateExpenseValues,
} from "@/lib/validations/expenses";
import { createExpense } from "@/app/actions/expenses";

export function OperatingExpenseForm({
  vehicleId,
  onSuccess,
  initialData,
}: {
  vehicleId: string;
  onSuccess?: (id: string) => void;
  initialData?: Partial<CreateExpenseValues>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const form = useForm<CreateExpenseValues>({
    resolver: zodResolver(createExpenseSchema) as unknown as Resolver<CreateExpenseValues>,
    defaultValues: {
      vehicleId: initialData?.vehicleId ?? vehicleId,
      type: initialData?.type ?? "fuel",
      amount: initialData?.amount ?? 0,
      date: initialData?.date ?? new Date().toISOString().split("T")[0],
      notes: initialData?.notes ?? "",
      fuelQuantity: initialData?.fuelQuantity,
      fuelUnit: initialData?.fuelUnit ?? "Litros",
      fuelStation: initialData?.fuelStation ?? "",
      fuelAddress: initialData?.fuelAddress ?? "",
      dueDate: initialData?.dueDate ?? "",
      termMonths: initialData?.termMonths,
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });

  function onSubmit(values: CreateExpenseValues) {
    setServerError(undefined);
    setSuccess(false);
    startTransition(async () => {
      const result = await createExpense({
        ...values,
        vehicleId,
        type: selectedType as "fuel" | "insurance" | "registration",
      });
      if ("error" in result) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push(`/vehicles/${vehicleId}`);
        }
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <SelectField
        label="Tipo de gasto"
        {...form.register("type")}
      >
        <option value="fuel">Combustible</option>
        <option value="insurance">Seguro</option>
        <option value="registration">Revisión vehicular</option>
      </SelectField>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput
          label="Monto"
          {...form.register("amount")}
          error={form.formState.errors.amount?.message}
        />
        <DateInput
          label="Fecha"
          {...form.register("date")}
        />
      </div>

      {selectedType === "fuel" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-4">
          <p className="text-sm font-semibold text-[#111111]">Datos del combustible</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput
              label="Cantidad"
              placeholder="35"
              currency=""
              {...form.register("fuelQuantity")}
              error={form.formState.errors.fuelQuantity?.message}
            />
            <SelectField
              label="Unidad"
              {...form.register("fuelUnit")}
              error={form.formState.errors.fuelUnit?.message}
            >
              <option value="Litros">Litros</option>
              <option value="Galones">Galones</option>
              <option value="m³">m³</option>
            </SelectField>
          </div>
          <TextField
            label="Estación (opcional)"
            placeholder="Petrolera La Paz"
            {...form.register("fuelStation")}
          />
          <TextField
            label="Dirección (opcional)"
            placeholder="Boulevard"
            {...form.register("fuelAddress")}
          />
        </div>
      )}

      {(selectedType === "insurance" || selectedType === "registration") && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-4">
          <p className="text-sm font-semibold text-[#111111]">Vencimiento</p>
          <p className="text-xs text-[#6B7280]">
            Indica una fecha de vencimiento O selecciona un plazo.
          </p>
          <DateInput
            label="Fecha de vencimiento"
            {...form.register("dueDate")}
          />
          <SelectField
            label="Plazo (meses)"
            {...form.register("termMonths")}
          >
            <option value="">Sin plazo</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </SelectField>
          {(form.formState.errors.dueDate?.message || form.formState.errors.termMonths?.message) && (
            <p className="text-xs text-[#DC2626]">
              {form.formState.errors.dueDate?.message ?? form.formState.errors.termMonths?.message}
            </p>
          )}
        </div>
      )}

      <TextareaField
        label="Notas (opcional)"
        placeholder="Detalles…"
        {...form.register("notes")}
      />

      {serverError && (
        <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
          {serverError}
        </p>
      )}

      {success && (
        <p className="rounded-xl bg-[#15803D]/10 p-3 text-sm text-[#15803D]">
          Gasto registrado correctamente.
        </p>
      )}

      <button
        className="w-full rounded-xl bg-[#d71920] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a80f16] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : initialData ? "Guardar cambios" : "Registrar gasto"}
      </button>
    </form>
  );
}
