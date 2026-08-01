import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

export function WorkshopCard({
  id,
  name,
  address,
  phone,
}: {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}) {
  return (
    <Link
      href={`/workshops/${id}`}
      className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#d71920] hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <p className="text-lg font-bold text-[#111111]">{name}</p>
        <StatusBadge variant="success">Activo</StatusBadge>
      </div>
      {address && <p className="mt-2 text-sm text-[#6B7280]">{address}</p>}
      {phone && <p className="mt-1 text-sm text-[#6B7280]">{phone}</p>}
    </Link>
  );
}
