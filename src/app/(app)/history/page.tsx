"use client";

import { useEffect, useTransition, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { RangeFilter } from "@/components/ui/range-filter";
import { getHistoryItems, type HistoryItem } from "@/app/actions/expenses";
import { getVehicles } from "@/app/actions/vehicles";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const CATEGORY_STYLES: Record<string, string> = {
  maintenance: "border-l-4 border-l-[#d71920]",
  fuel: "border-l-4 border-l-[#15803d]",
  insurance: "border-l-4 border-l-[#d97706]",
  registration: "border-l-4 border-l-[#d97706]",
  mileage: "border-l-4 border-l-[#9CA3AF]",
};

const CATEGORY_OPTIONS = [
  { value: "maintenance", label: "Servicio" },
  { value: "fuel", label: "Combustible" },
  { value: "insurance", label: "Seguro" },
  { value: "registration", label: "Revisión" },
  { value: "mileage", label: "Kilometraje" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "oil_change", label: "Aceite" },
  { value: "filter_change", label: "Filtro" },
  { value: "brake_change", label: "Frenos" },
  { value: "tire_change", label: "Llantas" },
  { value: "battery_change", label: "Batería" },
  { value: "tune_up", label: "Afinamiento" },
  { value: "general_repair", label: "Reparación" },
];

const PERIOD_PRESETS = [
  { key: "month", label: "Este mes" },
  { key: "quarter", label: "3 meses" },
  { key: "year", label: "Este año" },
];

function periodRange(key: string): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const to = new Date(y, m + 1, 0).toISOString().split("T")[0];
  if (key === "quarter") {
    return { from: new Date(y, m - 2, 1).toISOString().split("T")[0], to };
  }
  if (key === "year") {
    return { from: new Date(y, 0, 1).toISOString().split("T")[0], to };
  }
  return { from: new Date(y, m, 1).toISOString().split("T")[0], to };
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const [period, setPeriod] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<
    Array<{ id: string; plate: string; make: string; model: string }>
  >([]);

  function load(opts?: {
    period?: string;
    category?: string;
    type?: string;
    vehicleId?: string;
  }) {
    const p = opts?.period ?? period;
    const cat = opts?.category ?? categoryFilter;
    const type = opts?.type ?? typeFilter;
    const vid = opts?.vehicleId ?? vehicleId;

    startTransition(async () => {
      setError(undefined);
      const range = periodRange(p);

      const result = await getHistoryItems({
        from: range.from,
        to: range.to,
        vehicleId: vid || undefined,
        category: (cat || undefined) as
          | "maintenance"
          | "fuel"
          | "insurance"
          | "registration"
          | "mileage"
          | undefined,
        type: type || undefined,
      });

      if ("error" in result) {
        setError(result.error);
        setLoaded(true);
        return;
      }

      setItems(result.data);
      setTotal(result.total);
      setLoaded(true);
    });
  }

  useEffect(() => {
    getVehicles().then((result) => {
      if ("data" in result && result.data) {
        setVehicles(
          result.data.map((v) => ({
            id: v.id,
            plate: v.plate,
            make: v.make,
            model: v.model,
          })),
        );
      }
    });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <PageHeader
        title="Historial"
        subtitle={
          loaded
            ? `${items.length} registro${items.length !== 1 ? "s" : ""} · ${formatCurrency(total)}`
            : "Servicios, gastos y kilometraje"
        }
      />

      <div className="mt-4 space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <div>
          <p className="mb-2 text-sm font-medium text-[#6B7280]">Período</p>
          <div className="flex flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPeriod(p.key);
                  load({ period: p.key });
                }}
                className={
                  period === p.key
                    ? "rounded-full bg-[#d71920] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F7F7F8]"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <RangeFilter
          label="Categoría"
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            if (v !== "maintenance") setTypeFilter("");
            load({ category: v, type: v === "maintenance" ? typeFilter : "" });
          }}
        />

        {(categoryFilter === "" || categoryFilter === "maintenance") && (
          <RangeFilter
            label="Tipo de servicio"
            options={SERVICE_TYPE_OPTIONS}
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              load({ type: v });
            }}
          />
        )}

        {vehicles.length > 0 && (
          <label className="block text-sm font-medium text-[#111111]">
            Vehículo
            <select
              className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20"
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                load({ vehicleId: e.target.value });
              }}
            >
              <option value="">Todos los vehículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} · {v.plate}
                </option>
              ))}
            </select>
          </label>
        )}

        {isPending && (
          <p className="text-xs text-[#6B7280]">Actualizando historial…</p>
        )}
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

      {loaded && !error && items.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Sin registros"
            description="No se encontraron registros con los filtros seleccionados."
          />
        </div>
      )}

      {loaded && items.length > 0 && (
        <div className="mt-6 space-y-2">
          {items.map((item) => (
            <Link
              key={`${item.category}-${item.id}`}
              href={
                item.category === "mileage"
                  ? `/vehicles/${item.vehicleId}`
                  : `/history/${item.id}?cat=${item.category}`
              }
              className={`block rounded-xl bg-white px-4 py-3 shadow-sm transition hover:shadow-md ${CATEGORY_STYLES[item.category] ?? ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111111]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#6B7280]">{item.subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  {item.amount != null && (
                    <p className="text-sm font-bold text-[#111111]">
                      {formatCurrency(item.amount)}
                    </p>
                  )}
                  <p className="text-xs text-[#6B7280]">
                    {formatDate(item.date)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
