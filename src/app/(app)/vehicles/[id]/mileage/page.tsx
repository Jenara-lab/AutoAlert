"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { PageHeader } from "@/components/ui/page-header";
import { createMileageSchema, type CreateMileageValues } from "@/lib/validations/mileage";
import { addMileageLog } from "@/app/actions/mileage";

export default function MileageFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setVehicleId(p.id));
  }, [params]);

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const form = useForm<CreateMileageValues>({
    resolver: zodResolver(createMileageSchema) as unknown as Resolver<CreateMileageValues>,
    defaultValues: {
      mileage: 0,
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  function onSubmit(values: CreateMileageValues) {
    if (!vehicleId) return;
    setServerError(undefined);
    startTransition(async () => {
      const result = await addMileageLog(vehicleId, values);
      if ("error" in result) {
        setServerError(result.error);
      } else {
        router.push(`/vehicles/${vehicleId}`);
      }
    });
  }

  const input =
    "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

  return (
    <section>
      <PageHeader
        title="Actualizar kilometraje"
        backHref={vehicleId ? `/vehicles/${vehicleId}` : "/vehicles"}
      />
      <div className="mx-auto max-w-lg">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label className="block text-sm font-medium text-[#111111]">
            Kilometraje actual
            <input className={input} type="number" {...form.register("mileage")} />
            {form.formState.errors.mileage?.message && (
              <span className="mt-1 block text-xs text-[#DC2626]">
                {form.formState.errors.mileage.message}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-[#111111]">
            Fecha
            <input className={input} type="date" {...form.register("date")} />
            {form.formState.errors.date?.message && (
              <span className="mt-1 block text-xs text-[#DC2626]">
                {form.formState.errors.date.message}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-[#111111]">
            Nota (opcional)
            <textarea className={input} rows={3} {...form.register("note")} />
          </label>

          {serverError && (
            <p role="alert" className="rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
              {serverError}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-[#d71920] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#a80f16] disabled:opacity-60"
            disabled={pending || !vehicleId}
            type="submit"
          >
            {pending ? "Guardando…" : "Guardar kilometraje"}
          </button>
        </form>
      </div>
    </section>
  );
}
