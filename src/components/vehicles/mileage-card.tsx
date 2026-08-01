import { formatDate, formatMileage } from "@/lib/utils/format";

export function MileageCard({
  mileage,
  date,
  note,
}: {
  mileage: number;
  date: string;
  note: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold text-[#111111]">
          {formatMileage(mileage)}
        </p>
        <p className="text-xs text-[#6B7280]">{formatDate(date)}</p>
      </div>
      {note && (
        <p className="mt-2 text-sm text-[#6B7280]">{note}</p>
      )}
    </div>
  );
}
