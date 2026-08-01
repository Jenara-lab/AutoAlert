import Link from "next/link";
import { getDashboardData } from "@/app/actions/dashboard";
import { formatCurrency, formatDate, formatMileage } from "@/lib/utils/format";
import { cn } from "@/lib/utils/format";
import { ALERT_KIND_LABELS } from "@/types/domain";
import type { AlertKind } from "@/types/domain";

export default async function DashboardPage() {
  const result = await getDashboardData();

  if ("error" in result) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">
            Panel principal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bienvenido a AutoAlert</h1>
        </div>
        <div className="rounded-2xl border border-[#DC2626]/20 bg-[#DC2626]/10 p-6 text-sm text-[#DC2626]">
          {result.error}
        </div>
      </section>
    );
  }

  const d = result.data;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">
          Panel principal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Bienvenido a AutoAlert</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Vehículos"
          value={String(d.vehicleCount)}
          note={d.vehicleCount === 1 ? "registrado" : "registrados"}
        />
        <Metric
          label="Servicios próximos"
          value={String(d.upcomingServiceCount)}
          note={d.upcomingServiceCount === 1 ? "pendiente" : "pendientes"}
          accent={d.upcomingServiceCount > 0}
        />
        <Metric
          label="Gasto del mes"
          value={formatCurrency(d.monthlyExpenseTotal)}
          note="acumulado"
        />
        <Metric
          label="Alertas activas"
          value={String(d.pendingAlertCount)}
          note={d.pendingAlertCount === 1 ? "alerta" : "alertas"}
          accent={d.pendingAlertCount > 0}
        />
      </div>

      {d.upcomingServices.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Servicios próximos</h2>
          <div className="mt-4 divide-y divide-[#E5E7EB]">
            {d.upcomingServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">
                    {s.vehicleMake} {s.vehicleModel}
                  </p>
                  <p className="text-sm text-[#6B7280]">{s.vehiclePlate}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{formatDate(s.nextServiceDate)}</p>
                  {s.nextServiceMileage && (
                    <p className="text-[#6B7280]">
                      {formatMileage(s.nextServiceMileage)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.urgentAlerts.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Alertas urgentes</h2>
          <div className="mt-4 space-y-3">
            {d.urgentAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-[#D97706]/20 bg-[#D97706]/10 p-4"
              >
                <span className="mt-0.5 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-[#6B7280]">{a.message}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{a.vehiclePlate}</p>
                </div>
                {a.dueDate && (
                  <span className="whitespace-nowrap text-xs text-[#6B7280]">
                    {formatDate(a.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {d.vehicleCount === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-6 text-sm leading-6 text-[#6B7280]">
          Comienza registrando tu primer vehículo en{" "}
          <Link href="/vehicles/new" className="font-medium text-[#d71920] underline">
            Vehículos → Nuevo
          </Link>
          .
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-bold",
          accent ? "text-[#d71920]" : "text-[#111111]"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-[#6B7280]">{note}</p>
    </article>
  );
}
