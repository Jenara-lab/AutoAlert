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
      className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-gray-900 transition group-hover:text-[#d71920]">
            {make} {model}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {year} · {plate}
          </p>
        </div>
        <StatusBadge variant="success">{fuelType}</StatusBadge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        {currentMileage.toLocaleString("es-HN")} km
      </div>
    </Link>
  );
}
