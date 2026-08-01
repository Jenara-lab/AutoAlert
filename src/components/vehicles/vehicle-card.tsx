import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

export function VehicleCard({
  id,
  plate,
  make,
  model,
  year,
  currentMileage,
  fuelType,
}: {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
  fuelType: string;
}) {
  return (
    <Link
      href={`/vehicles/${id}`}
      className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#d71920] hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-[#111111]">
            {make} {model}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {year} · {plate}
          </p>
        </div>
        <StatusBadge variant="success">{fuelType}</StatusBadge>
      </div>
      <p className="mt-3 text-sm text-[#6B7280]">
        {currentMileage.toLocaleString("es-HN")} km
      </p>
    </Link>
  );
}
