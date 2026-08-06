"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { DateInput } from "@/components/ui/date-input";
import { MileageInput } from "@/components/ui/mileage-input";
import { TextareaField } from "@/components/ui/select-field";
import { MoneyInput } from "@/components/ui/money-input";
import { WorkshopSelector } from "@/components/ui/workshop-selector";
import {
  createMaintenanceSchema,
  type CreateMaintenanceValues,
} from "@/lib/validations/maintenance";
import type { MaintenanceType } from "@/types/domain";

export function MaintenanceForm({
  vehicleId,
  serviceType,
  onSuccess,
  initialData,
  workshopRequired = false,
  mode = "create",
  action,
  redirectTo,
}: {
  vehicleId: string;
  serviceType?: MaintenanceType;
  onSuccess?: (id?: string) => void;
  initialData?: Partial<CreateMaintenanceValues>;
  workshopRequired?: boolean;
  mode?: "create" | "edit";
  action?: (values: CreateMaintenanceValues) => Promise<{ error?: string; data?: string }>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const form = useForm<CreateMaintenanceValues>({
    resolver: zodResolver(createMaintenanceSchema) as unknown as Resolver<CreateMaintenanceValues>,
    defaultValues: {
      vehicleId: initialData?.vehicleId ?? vehicleId,
      workshopId: initialData?.workshopId ?? "",
      type: initialData?.type ?? serviceType ?? "general_repair",
      mileage: initialData?.mileage ?? 0,
      serviceDate: initialData?.serviceDate ?? new Date().toISOString().split("T")[0],
      description: initialData?.description ?? "",
      costTotal: initialData?.costTotal,
      costLabor: initialData?.costLabor,
      costParts: initialData?.costParts,
      nextServiceDate: initialData?.nextServiceDate ?? "",
      nextServiceMileage: initialData?.nextServiceMileage,
    },
  });

  const workshopId = useWatch({ control: form.control, name: "workshopId" });

  function onSubmit(values: CreateMaintenanceValues) {
    setServerError(undefined);
    setSuccess(false);
    startTransition(async () => {
      const result =
        mode === "edit" && action
          ? await action(values)
          : await import("@/app/actions/maintenance").then((m) =>
              m.createMaintenance({
                ...values,
                vehicleId,
                type: serviceType ?? (values.type as MaintenanceType),
              }),
            );
      if ("error" in result) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        if (redirectTo) {
          router.push(redirectTo);
        } else if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push(`/vehicles/${vehicleId}`);
        }
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <DateInput
        label="Fecha del servicio"
        {...form.register("serviceDate")}
        error={form.formState.errors.serviceDate?.message}
      />

      <MileageInput
        label="Kilometraje actual"
        {...form.register("mileage")}
        error={form.formState.errors.mileage?.message}
      />

      <TextareaField
        label="Descripción (opcional)"
        placeholder="Detalles del servicio…"
        {...form.register("description")}
      />

      <WorkshopSelector
        vehicleId={vehicleId}
        label={workshopRequired ? "Taller vinculado" : "Taller vinculado (opcional)"}
        value={workshopId ?? ""}
        onChange={(id) => form.setValue("workshopId", id, { shouldValidate: true })}
        error={form.formState.errors.workshopId?.message}
        required={workshopRequired}
      />

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-[#111111]">Costos</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <MoneyInput
            label="Mano de obra"
            placeholder="0.00"
            {...form.register("costLabor")}
          />
          <MoneyInput
            label="Repuestos"
            placeholder="0.00"
            {...form.register("costParts")}
          />
          <MoneyInput
            label="Total"
            placeholder="0.00"
            {...form.register("costTotal")}
            error={form.formState.errors.costTotal?.message}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-[#111111]">Próximo servicio</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateInput
            label="Fecha"
            {...form.register("nextServiceDate")}
          />
          <MileageInput
            label="Kilometraje"
            placeholder="Ej: 50000"
            {...form.register("nextServiceMileage")}
          />
        </div>
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
          {serverError}
        </p>
      )}

      {success && (
        <p className="rounded-xl bg-[#15803D]/10 p-3 text-sm text-[#15803D]">
          {mode === "edit" ? "Servicio actualizado correctamente." : "Servicio registrado correctamente."}
        </p>
      )}

      <button
        className="w-full rounded-xl bg-[#d71920] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a80f16] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Registrar servicio"}
      </button>
    </form>
  );
}
