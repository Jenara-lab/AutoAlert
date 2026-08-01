"use client";

import { useEffect, useTransition, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { RangeFilter } from "@/components/ui/range-filter";
import {
  getUpcomingAlerts,
  generateAlertsNow,
  type UpcomingAlertItem,
} from "@/app/actions/alerts";
import { UpcomingServiceList } from "@/components/reports/upcoming-service-list";

const KIND_OPTIONS = [
  { value: "maintenance_date", label: "Servicio por fecha" },
  { value: "maintenance_mileage", label: "Kilometraje" },
  { value: "insurance_expiry", label: "Seguro" },
  { value: "registration_expiry", label: "Revisión" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<UpcomingAlertItem[]>([]);
  const [filtered, setFiltered] = useState<UpcomingAlertItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [kindFilter, setKindFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [scanMessage, setScanMessage] = useState<string>();

  function applyFilter(items: UpcomingAlertItem[], kind = kindFilter) {
    if (!kind) return items;
    return items.filter((a) => a.kind === kind);
  }

  function load() {
    startTransition(async () => {
      setError(undefined);
      const result = await getUpcomingAlerts();
      if ("error" in result) {
        setError(result.error);
        setLoaded(true);
        return;
      }
      setAlerts(result.data);
      setFiltered(applyFilter(result.data));
      setLoaded(true);
    });
  }

  useEffect(() => {
    startTransition(async () => {
      await generateAlertsNow();
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleKindChange(value: string) {
    setKindFilter(value);
    setFiltered(applyFilter(alerts, value));
  }

  function handleGenerate() {
    startTransition(async () => {
      setScanMessage(undefined);
      const result = await generateAlertsNow();
      if ("error" in result) {
        setScanMessage(result.error);
        return;
      }
      const { created, updated, skipped } = result.data;
      setScanMessage(
        `Alertas: ${created} nuevas, ${updated} actualizadas, ${skipped} sin cambios.`
      );
      load();
    });
  }

  return (
    <section>
      <PageHeader
        title="Alertas"
        subtitle="Servicios próximos, kilometraje y vencimientos"
        action={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="rounded-xl bg-[#d71920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a80f16] disabled:opacity-60"
          >
            {isPending ? "Procesando…" : "Actualizar alertas"}
          </button>
        }
      />

      {scanMessage && (
        <p className="mb-4 rounded-xl bg-[#15803D]/10 p-3 text-sm text-[#15803D]">
          {scanMessage}
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <RangeFilter
          label="Tipo"
          options={KIND_OPTIONS}
          value={kindFilter}
          onChange={handleKindChange}
          allLabel="Todos"
        />
      </div>

      {!loaded && (
        <div className="mt-6">
          <LoadingSkeleton rows={4} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
          {error}
        </p>
      )}

      {loaded && !error && filtered.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Sin alertas"
            description="No hay servicios próximos ni vencimientos futuros con este filtro."
          />
        </div>
      )}

      {loaded && !error && filtered.length > 0 && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-[#6B7280]">
            {filtered.length} alerta{filtered.length !== 1 ? "s" : ""} mostrada
            {filtered.length !== alerts.length ? ` de ${alerts.length}` : ""}
          </p>
          <UpcomingServiceList
            services={filtered.map((a) => ({
              id: a.id,
              vehicleId: a.vehicleId,
              vehiclePlate: a.vehiclePlate,
              vehicleMake: a.vehicleMake,
              vehicleModel: a.vehicleModel,
              currentMileage: a.currentMileage,
              nextServiceDate: a.dueDate ?? "",
              nextServiceMileage: a.dueMileage,
              kind: a.kind,
              type: a.type,
              typeLabel: a.typeLabel,
            }))}
          />
        </div>
      )}
    </section>
  );
}
