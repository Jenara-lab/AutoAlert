"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import {
  createVehicleSchema,
  type CreateVehicleValues,
} from "@/lib/validations/vehicles";
import { VEHICLE_MAKES, getModelsForMake } from "@/lib/utils/vehicle-catalog";
import { MileageInput } from "@/components/ui/mileage-input";
import { ButtonLink } from "@/components/ui/button";

const FUEL_TYPES = ["Gasolina", "Diesel", "Eléctrico", "Híbrido", "GNV"];

export function VehicleForm({
  action,
  defaultValues,
  mode = "create",
}: {
  action: (values: CreateVehicleValues) => Promise<{ error?: string; data?: string | undefined }>;
  defaultValues?: Partial<CreateVehicleValues>;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string>();

  const form = useForm<CreateVehicleValues>({
    resolver: zodResolver(createVehicleSchema) as unknown as Resolver<CreateVehicleValues>,
    defaultValues: {
      plate: "",
      make: defaultValues?.make ?? "",
      model: defaultValues?.model ?? "",
      year: new Date().getFullYear(),
      vin: "",
      fuelType: "Gasolina",
      currentMileage: 0,
      ...defaultValues,
    },
  });

  const selectedMake = useWatch({ control: form.control, name: "make" });
  const selectedModel = useWatch({ control: form.control, name: "model" });
  const catalogModels = selectedMake ? [...getModelsForMake(selectedMake)] : [];
  const models =
    selectedModel && !catalogModels.includes(selectedModel)
      ? [selectedModel, ...catalogModels]
      : catalogModels;
  const makes =
    selectedMake && !(VEHICLE_MAKES as readonly string[]).includes(selectedMake)
      ? [selectedMake, ...VEHICLE_MAKES]
      : [...VEHICLE_MAKES];

  function onSubmit(values: CreateVehicleValues) {
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
          form.reset({
            plate: "",
            make: "",
            model: "",
            year: new Date().getFullYear(),
            vin: "",
            fuelType: "Gasolina",
          });
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
      <Field label="Placa" error={form.formState.errors.plate?.message}>
        <input className={input} placeholder="ABC 123" {...form.register("plate")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca" error={form.formState.errors.make?.message}>
          <select
            className={input}
            {...form.register("make", {
              onChange: () => {
                form.setValue("model", "");
              },
            })}
          >
            <option value="">Selecciona una marca</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Modelo" error={form.formState.errors.model?.message}>
          <select
            className={input}
            disabled={!selectedMake}
            {...form.register("model")}
          >
            <option value="">
              {selectedMake ? "Selecciona un modelo" : "Primero elige la marca"}
            </option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Año" error={form.formState.errors.year?.message}>
          <input className={input} type="number" {...form.register("year")} />
        </Field>
        <Field label="VIN (opcional)" error={form.formState.errors.vin?.message}>
          <input className={input} placeholder="17 caracteres" maxLength={17} {...form.register("vin")} />
        </Field>
      </div>

      <Field label="Tipo de combustible" error={form.formState.errors.fuelType?.message}>
        <select className={input} {...form.register("fuelType")}>
          {FUEL_TYPES.map((ft) => (
            <option key={ft} value={ft}>{ft}</option>
          ))}
        </select>
      </Field>

      <MileageInput
        label="Kilometraje actual"
        placeholder="Ej: 45000"
        {...form.register("currentMileage")}
        error={form.formState.errors.currentMileage?.message}
      />

      {serverError && (
        <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
          {serverError}
        </p>
      )}

      {success && (
        <div className="rounded-xl bg-[#15803D]/10 p-4 text-sm text-[#15803D]">
          <p className="font-semibold">Vehículo {mode === "create" ? "creado" : "actualizado"} correctamente.</p>
          {mode === "create" && createdId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink href={`/vehicles/${createdId}`} variant="primary" className="text-xs">
                Ver vehículo
              </ButtonLink>
              <Link
                href="/vehicles"
                className="rounded-lg border-2 border-[#15803D] px-3 py-1.5 text-xs font-semibold text-[#15803D] hover:bg-[#15803D]/10"
              >
                Ir a vehículos
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
        {pending ? "Guardando…" : mode === "create" ? "Crear vehículo" : "Guardar cambios"}
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
