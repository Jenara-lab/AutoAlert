import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { getVehicle } from "@/app/actions/vehicles";
import { getMileageLogs } from "@/app/actions/mileage";
import { getVehicleWorkshops } from "@/app/actions/vehicle-workshops";
import { getMaintenanceRecords } from "@/app/actions/maintenance";
import { getOperatingExpenses } from "@/app/actions/expenses";
import { formatMileage, formatDate, formatCurrency } from "@/lib/utils/format";
import { requireAuth } from "@/lib/permissions/auth";
import { MAINTENANCE_TYPE_LABELS, EXPENSE_TYPE_LABELS } from "@/types/domain";
import type { OperatingExpenseType } from "@/types/domain";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="mt-3 text-xl font-bold text-[#111111]">{value}</p>
    </article>
  );
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const result = await getVehicle(id);

  if ("error" in result) notFound();

  const vehicle = result.data as unknown as {
    id: string;
    plate: string;
    make: string;
    model: string;
    year: number;
    current_mileage: number;
    fuel_type: string;
    vin: string | null;
    owner_id: string;
    created_at: string;
  };

  const [mileageResult, workshopsResult, maintenanceResult, expensesResult] =
    await Promise.all([
      getMileageLogs(id),
      getVehicleWorkshops(id),
      getMaintenanceRecords({ vehicleId: id }),
      getOperatingExpenses({ vehicleId: id }),
    ]);

  const mileageLogs =
    "data" in mileageResult && mileageResult.data ? mileageResult.data : [];
  const workshops =
    "data" in workshopsResult && workshopsResult.data
      ? workshopsResult.data
      : [];
  const maintenanceRecords =
    "data" in maintenanceResult && maintenanceResult.data
      ? maintenanceResult.data
      : [];
  const operatingExpenses =
    "data" in expensesResult && expensesResult.data
      ? expensesResult.data
      : [];

  const isOwner = user.role === "owner" && vehicle.owner_id === user.id;
  const canRecordMaintenance = isOwner || user.role === "mechanic";

  return (
    <section>
      <PageHeader
        title={`${vehicle.make} ${vehicle.model}`}
        subtitle={`${vehicle.year} · ${vehicle.plate}`}
        backHref="/vehicles"
        action={
          isOwner ? (
            <ButtonLink href={`/vehicles/${id}/edit`} variant="secondary">
              Editar
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Kilometraje actual"
          value={formatMileage(vehicle.current_mileage)}
        />
        <Metric label="Combustible" value={vehicle.fuel_type} />
        <Metric label="VIN" value={vehicle.vin || "—"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canRecordMaintenance && (
          <ButtonLink href={`/vehicles/${id}/maintenance`} variant="primary">
            Registrar servicio
          </ButtonLink>
        )}
        {isOwner && (
          <>
            <ButtonLink
              href={`/vehicles/${id}/expenses/new`}
              variant="secondary"
            >
              Gasto operativo
            </ButtonLink>
            <ButtonLink href={`/vehicles/${id}/mileage`} variant="secondary">
              Actualizar km
            </ButtonLink>
            <ButtonLink href={`/vehicles/${id}/workshops`} variant="secondary">
              Talleres
            </ButtonLink>
          </>
        )}
      </div>

      {mileageLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111111]">
            Historial de kilometraje
          </h2>
          <div className="mt-3 space-y-2">
            {mileageLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-[#111111]">
                  {formatMileage(log.mileage)}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {formatDate(log.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workshops.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111111]">
            Talleres vinculados
          </h2>
          <div className="mt-3 space-y-2">
            {workshops.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-[#111111]">
                  {w.workshopName}
                </span>
                <StatusBadge variant={w.active ? "success" : "muted"}>
                  {w.active ? "Activo" : "Inactivo"}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {operatingExpenses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111111]">
            Gastos operativos
          </h2>
          <div className="mt-3 space-y-2">
            {operatingExpenses.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#111111]">
                    {EXPENSE_TYPE_LABELS[e.type as OperatingExpenseType] ??
                      e.type}
                  </span>
                  <span className="text-sm font-medium text-[#D71920]">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{formatDate(e.date)}</span>
                  {e.fuelStation && <span>{e.fuelStation}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {maintenanceRecords.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111111]">
            Historial de reparaciones
          </h2>
          <div className="mt-3 space-y-2">
            {maintenanceRecords.map((r) => (
              <Link
                key={r.id}
                href={`/history/${r.id}`}
                className="block rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 transition hover:border-[#d71920]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#111111]">
                    {MAINTENANCE_TYPE_LABELS[
                      r.type as keyof typeof MAINTENANCE_TYPE_LABELS
                    ] ?? r.type}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {formatDate(r.serviceDate)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{formatMileage(r.mileage)}</span>
                  {r.workshopName && <span>{r.workshopName}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
