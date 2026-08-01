import { formatCurrency } from "@/lib/utils/format";

export function ReportSummaryCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string | number; sublabel?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              {item.sublabel && (
                <p className="text-xs text-[#6B7280]">{item.sublabel}</p>
              )}
            </div>
            <span className="text-sm font-bold">
              {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
