import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type { HistoryCategory } from "@/app/actions/expenses";

const categoryColors: Record<HistoryCategory, string> = {
  maintenance: "#D71920",
  fuel: "#D97706",
  insurance: "#15803D",
  registration: "#6B7280",
  mileage: "#3B82F6",
};

export function HistoryItem({
  id,
  category,
  date,
  title,
  subtitle,
  amount,
  vehicleId,
  vehiclePlate,
}: {
  id: string;
  category: HistoryCategory;
  date: string;
  title: string;
  subtitle: string;
  amount: number | null;
  vehicleId: string;
  vehiclePlate: string;
}) {
  return (
    <Link
      href={`/history/${id}?cat=${category}`}
      className="block rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:shadow-md"
      style={{ borderLeftColor: categoryColors[category], borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111111]">{title}</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>
        </div>
        <p className="whitespace-nowrap text-xs text-[#6B7280]">
          {formatDate(date)}
        </p>
      </div>
      {amount !== null && (
        <p className="mt-2 text-sm font-bold text-[#111111]">
          {formatCurrency(amount)}
        </p>
      )}
    </Link>
  );
}
