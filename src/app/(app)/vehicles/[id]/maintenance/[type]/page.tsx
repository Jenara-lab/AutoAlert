import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { getCurrentUserRole } from "@/lib/permissions/auth";
import { MAINTENANCE_TYPE_LABELS } from "@/types/domain";
import type { MaintenanceType } from "@/types/domain";

const VALID_TYPES: MaintenanceType[] = [
  "oil_change",
  "filter_change",
  "brake_change",
  "tire_change",
  "battery_change",
  "tune_up",
  "general_repair",
];

export default async function MaintenanceFormPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { id, type } = await params;

  if (!VALID_TYPES.includes(type as MaintenanceType)) {
    notFound();
  }

  const serviceType = type as MaintenanceType;
  const role = await getCurrentUserRole();
  const workshopRequired = role === "mechanic";

  return (
    <section>
      <PageHeader
        title={MAINTENANCE_TYPE_LABELS[serviceType]}
        backHref={`/vehicles/${id}/maintenance`}
      />
      <div className="mx-auto max-w-lg">
        <MaintenanceForm
          vehicleId={id}
          serviceType={serviceType}
          workshopRequired={workshopRequired}
        />
      </div>
    </section>
  );
}
