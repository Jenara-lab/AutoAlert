import Link from "next/link";
import type { MaintenanceType } from "@/types/domain";

export function MaintenanceTypeCard({
  type,
  label,
  icon,
  vehicleId,
}: {
  type: MaintenanceType;
  label: string;
  icon: string;
  vehicleId: string;
}) {
  return (
    <Link
      href={`/vehicles/${vehicleId}/maintenance/${type}`}
      className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:border-[#D71920] hover:shadow-md"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-[#111111]">{label}</span>
    </Link>
  );
}
