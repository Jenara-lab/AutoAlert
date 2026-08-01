"use client";

import { useEffect, useTransition, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";

import { getReportData, type ReportData } from "@/app/actions/reports";
import { getVehicles } from "@/app/actions/vehicles";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function periodPreset(key: string): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const to = new Date(y, m + 1, 0).toISOString().split("T")[0];

  if (key === "month") {
    return {
      from: new Date(y, m, 1).toISOString().split("T")[0],
      to,
    };
  }
  if (key === "quarter") {
    return {
      from: new Date(y, m - 2, 1).toISOString().split("T")[0],
      to,
    };
  }
  if (key === "year") {
    return {
      from: new Date(y, 0, 1).toISOString().split("T")[0],
      to,
    };
  }
  // last 6 months default
  return {
    from: new Date(y, m - 5, 1).toISOString().split("T")[0],
    to,
  };
}

const PRESETS = [
  { key: "month", label: "Este mes" },
  { key: "quarter", label: "3 meses" },
  { key: "6m", label: "6 meses" },
  { key: "year", label: "Este año" },
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [preset, setPreset] = useState("6m");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<
    Array<{ id: string; plate: string; make: string; model: string }>
  >([]);
  const [isPending, startTransition] = useTransition();

  function load(nextPreset = preset, nextVehicleId = vehicleId) {
    startTransition(async () => {
      setError(undefined);
      const period = periodPreset(nextPreset);
      const result = await getReportData({
        ...period,
        vehicleId: nextVehicleId || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        setLoaded(true);
        return;
      }
      setData(result.data);
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
        title="Reportes"
        subtitle="Gastos, servicios, tendencias y próximos eventos"
      />

      <div className="mt-4 space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <div>
          <p className="mb-2 text-sm font-medium text-[#6B7280]">Período</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPreset(p.key);
                  load(p.key, vehicleId);
                }}
                className={
                  preset === p.key
                    ? "rounded-full bg-[#d71920] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F7F7F8]"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {vehicles.length > 0 && (
          <label className="block text-sm font-medium text-[#111111]">
            Vehículo
            <select
              className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20"
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                load(preset, e.target.value);
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

        {data && (
          <p className="text-xs text-[#6B7280]">
            Del {formatDate(data.period.from)} al {formatDate(data.period.to)}
            {isPending ? " · Actualizando…" : ""}
          </p>
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

      {loaded && data && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryMetric
              label="Gastos operativos"
              value={formatCurrency(data.totals.expenses)}
            />
            <SummaryMetric
              label="Servicios / reparaciones"
              value={formatCurrency(data.totals.maintenance)}
            />
            <SummaryMetric
              label="Total del período"
              value={formatCurrency(data.totals.grand)}
              accent
            />
          </div>

          {data.expensesByType.length > 0 && (
            <ReportSummaryCard
              title="Gastos operativos por tipo"
              items={data.expensesByType.map((e) => ({
                label: e.label,
                value: e.total,
              }))}
            />
          )}

          {data.expensesByVehicle.length > 0 && (
            <ReportSummaryCard
              title="Costo total por vehículo"
              items={data.expensesByVehicle.map((v) => ({
                label: `${v.make} ${v.model}`,
                sublabel: v.plate,
                value: v.total,
              }))}
            />
          )}

          {data.servicesByType.length > 0 && (
            <ReportSummaryCard
              title="Servicios realizados"
              items={data.servicesByType.map((s) => ({
                label: s.label,
                sublabel: `${s.count} registro${s.count !== 1 ? "s" : ""}`,
                value: s.totalCost,
              }))}
            />
          )}

          {data.monthlyTotals.length > 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Tendencia mensual</h2>
              <div className="mt-4 space-y-3">
                {data.monthlyTotals.map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-medium">{m.month}</span>
                    <div className="flex flex-wrap justify-end gap-3 text-sm">
                      <span className="text-[#6B7280]">
                        Gastos: {formatCurrency(m.expenses)}
                      </span>
                      <span className="text-[#6B7280]">
                        Servicios: {formatCurrency(m.maintenance)}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(m.expenses + m.maintenance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.expensesByType.length === 0 &&
            data.servicesByType.length === 0 &&
            data.upcomingServices.length === 0 && (
              <EmptyState
                title="Sin datos en el período"
                description="No hay gastos ni servicios registrados con estos filtros. Prueba otro período o registra actividad."
                action={
                  <Link
                    href="/dashboard/add"
                    className="rounded-xl bg-[#d71920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a80f16]"
                  >
                    Registrar actividad
                  </Link>
                }
              />
            )}
        </div>
      )}
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p
        className={
          accent
            ? "mt-3 text-2xl font-bold text-[#d71920]"
            : "mt-3 text-2xl font-bold text-[#111111]"
        }
      >
        {value}
      </p>
    </article>
  );
}
