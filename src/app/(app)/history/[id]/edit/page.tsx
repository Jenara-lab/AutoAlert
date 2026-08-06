import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { getMaintenanceRecord, updateMaintenance } from "@/app/actions/maintenance";
import { requireAuth } from "@/lib/permissions/auth";
import type { MaintenanceType } from "@/types/domain";
import type { CreateMaintenanceValues } from "@/lib/validations/maintenance";


function formatNumberInput(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return Number(value);
}

export default async function EditMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;

  if (cat !== "maintenance") {
    notFound();
  }

  const user = await requireAuth();
  const result = await getMaintenanceRecord(id);

  if ("error" in result || !result.data) {
    notFound();
  }

  const r = result.data as unknown as {
    id: string;
    vehicle_id: string;
    creator_id: string;
    workshop_id: string | null;
    type: MaintenanceType;
    mileage: number;
    service_date: string;
    description: string | null;
    cost_total: number | null;
    cost_labor: number | null;
    cost_parts: number | null;
    next_service_date: string | null;
    next_service_mileage: number | null;
  };

  if (r.creator_id !== user.id) {
    redirect(`/history/${id}?cat=maintenance`);
  }

  async function handleUpdate(values: CreateMaintenanceValues) {
    "use server";
    return updateMaintenance(id, values);
  }

  return (
    <section>
      <PageHeader title="Editar servicio" backHref={`/history/${id}?cat=maintenance`} />
      <div className="mx-auto max-w-lg">
        <MaintenanceForm
          mode="edit"
          vehicleId={r.vehicle_id}
          serviceType={r.type}
          action={handleUpdate}
          redirectTo={`/history/${id}?cat=maintenance`}
          initialData={{
            vehicleId: r.vehicle_id,
            workshopId: r.workshop_id ?? "",
            type: r.type,
            mileage: r.mileage,
            serviceDate: r.service_date,
            description: r.description ?? "",
            costTotal: formatNumberInput(r.cost_total),
            costLabor: formatNumberInput(r.cost_labor),
            costParts: formatNumberInput(r.cost_parts),
            nextServiceDate: r.next_service_date ?? "",
            nextServiceMileage: formatNumberInput(r.next_service_mileage),
          }}
        />
      </div>
    </section>
  );
}
