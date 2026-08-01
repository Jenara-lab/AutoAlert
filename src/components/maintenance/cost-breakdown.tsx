import { formatCurrency } from "@/lib/utils/format";

export function CostBreakdown({
  labor,
  parts,
  total,
}: {
  labor?: number | null;
  parts?: number | null;
  total?: number | null;
}) {
  const hasAny = (labor != null && labor > 0) || (parts != null && parts > 0) || (total != null && total > 0);
  if (!hasAny) return null;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
      <p className="text-sm font-semibold text-[#111111]">Costos</p>
      {labor != null && labor > 0 && (
        <Row label="Mano de obra" value={formatCurrency(labor)} />
      )}
      {parts != null && parts > 0 && (
        <Row label="Repuestos" value={formatCurrency(parts)} />
      )}
      {total != null && total > 0 && (
        <div className="border-t border-[#E5E7EB] pt-2">
          <Row label="Total" value={formatCurrency(total)} bold />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className={`text-sm text-right ${bold ? "font-bold" : "font-medium"} text-[#111111]`}>
        {value}
      </span>
    </div>
  );
}
