import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/format";

const KIND_ICONS: Record<string, string> = {
  maintenance_date: "🔧",
  maintenance_mileage: "📏",
  insurance_expiry: "🛡️",
  registration_expiry: "📋",
};

export function AlertCard({
  title,
  message,
  kind,
  vehiclePlate,
  dueDate,
  status,
}: {
  title: string;
  message: string;
  kind: string;
  vehiclePlate: string;
  dueDate: string | null;
  status: string;
}) {
  const isPending = status === "pending";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition",
        isPending
          ? "border-amber-200 bg-amber-50"
          : "border-gray-100 bg-white shadow-black/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl">{KIND_ICONS[kind] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{title}</p>
            {isPending && (
              <span className="rounded-full bg-[#D71920] px-2 py-0.5 text-xs font-semibold text-white">
                Nueva
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-gray-500">{message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500">
            <span>{vehiclePlate}</span>
            {dueDate && <span>Vence: {formatDate(dueDate)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
