import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from "@/types/domain";
import type { MaintenanceType } from "@/types/domain";

const TYPES: MaintenanceType[] = [
  "oil_change",
  "filter_change",
  "brake_change",
  "tire_change",
  "battery_change",
  "tune_up",
  "general_repair",
];

export default function MaintenanceTypePickerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PickerInner params={params} />;
}

async function PickerInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <section>
      <PageHeader title="Tipo de servicio" backHref={`/vehicles/${id}`} />
      <div className="mx-auto max-w-lg grid gap-3">
        {TYPES.map((type) => (
          <Link
            key={type}
            href={`/vehicles/${id}/maintenance/${type}`}
            className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#d71920] hover:shadow-md"
          >
            <span className="text-3xl">{MAINTENANCE_TYPE_ICONS[type]}</span>
            <p className="font-semibold text-[#111111]">
              {MAINTENANCE_TYPE_LABELS[type]}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
