import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CostBreakdown } from "@/components/maintenance/cost-breakdown";
import { getMaintenanceRecord } from "@/app/actions/maintenance";
import { getOperatingExpense } from "@/app/actions/expenses";
import { formatCurrency, formatDate, formatMileage } from "@/lib/utils/format";
import { MAINTENANCE_TYPE_LABELS, EXPENSE_TYPE_LABELS } from "@/types/domain";

export default async function RecordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { id } = await params;
  const { cat } = await searchParams;

  if (cat === "mileage") {
    return (
      <section>
        <PageHeader title="Registro de kilometraje" backHref="/history" />
        <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm text-[#6B7280]">Detalle del kilometraje próximamente disponible.</p>
        </div>
      </section>
    );
  }

  if (cat === "maintenance") {
    const result = await getMaintenanceRecord(id);
    if ("error" in result || !result.data) notFound();

    const r = result.data as unknown as {
      id: string;
      type: string;
      mileage: number;
      service_date: string;
      description: string | null;
      cost_total: number | null;
      cost_labor: number | null;
      cost_parts: number | null;
      next_service_date: string | null;
      next_service_mileage: number | null;
      vehicles: { plate: string; make: string; model: string } | null;
      workshops: { name: string } | null;
    };

    return (
      <section>
        <PageHeader
          title={MAINTENANCE_TYPE_LABELS[r.type as keyof typeof MAINTENANCE_TYPE_LABELS] ?? r.type}
          backHref="/history"
        />
        <div className="mx-auto max-w-lg space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
            <Row label="Vehículo" value={`${r.vehicles?.make} ${r.vehicles?.model} · ${r.vehicles?.plate}`} />
            <Row label="Fecha" value={formatDate(r.service_date)} />
            <Row label="Kilometraje" value={formatMileage(r.mileage)} />
            {r.workshops && <Row label="Taller" value={r.workshops.name} />}
            {r.description && <Row label="Descripción" value={r.description} />}
          </div>

          <CostBreakdown
            labor={r.cost_labor}
            parts={r.cost_parts}
            total={r.cost_total}
          />

          {(r.next_service_date || r.next_service_mileage) && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-[#111111]">Próximo servicio</p>
              {r.next_service_date && <Row label="Fecha" value={formatDate(r.next_service_date)} />}
              {r.next_service_mileage && <Row label="Kilometraje" value={formatMileage(r.next_service_mileage)} />}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (cat === "fuel" || cat === "insurance" || cat === "registration") {
    const result = await getOperatingExpense(id);
    if ("error" in result || !result.data) notFound();

    const r = result.data as unknown as {
      type: string;
      amount: number;
      date: string;
      notes: string | null;
      fuel_quantity: number | null;
      fuel_unit: string | null;
      fuel_station: string | null;
      fuel_address: string | null;
      due_date: string | null;
      term_months: number | null;
      vehicles: { plate: string; make: string; model: string } | null;
    };

    return (
      <section>
        <PageHeader
          title={EXPENSE_TYPE_LABELS[r.type as keyof typeof EXPENSE_TYPE_LABELS] ?? r.type}
          backHref="/history"
        />
        <div className="mx-auto max-w-lg space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
            <Row label="Vehículo" value={`${r.vehicles?.make} ${r.vehicles?.model} · ${r.vehicles?.plate}`} />
            <Row label="Fecha" value={formatDate(r.date)} />
            <Row label="Monto" value={formatCurrency(r.amount)} />
            {r.notes && <Row label="Notas" value={r.notes} />}
          </div>

          {r.type === "fuel" && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-[#111111]">Datos del combustible</p>
              {r.fuel_quantity != null && (
                <Row label="Cantidad" value={`${r.fuel_quantity} ${r.fuel_unit ?? ""}`} />
              )}
              {r.fuel_station && <Row label="Estación" value={r.fuel_station} />}
              {r.fuel_address && <Row label="Dirección" value={r.fuel_address} />}
            </div>
          )}

          {(r.type === "insurance" || r.type === "registration") && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-[#111111]">Vencimiento</p>
              {r.due_date && <Row label="Fecha de vencimiento" value={formatDate(r.due_date)} />}
              {r.term_months && <Row label="Plazo" value={`${r.term_months} meses`} />}
            </div>
          )}
        </div>
      </section>
    );
  }

  notFound();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm font-medium text-[#111111] text-right">{value}</span>
    </div>
  );
}
