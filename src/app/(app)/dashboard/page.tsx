import Link from "next/link";
import { getDashboardData } from "@/app/actions/dashboard";
import { formatCurrency, formatDate, formatMileage } from "@/lib/utils/format";
import { cn } from "@/lib/utils/format";
import { Card, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const result = await getDashboardData();

  if ("error" in result) {
    return (
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">
            Panel principal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Bienvenido a AutoAlert
          </h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {result.error}
        </div>
      </section>
    );
  }

  const d = result.data;

  return (
    <section className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">
          Panel principal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Bienvenido a AutoAlert
        </h1>
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
        <Card>
          <CardTitle>Servicios próximos</CardTitle>
          <div className="mt-4 divide-y divide-gray-100">
            {d.upcomingServices.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {s.vehicleMake} {s.vehicleModel}
                  </p>
                  <p className="text-sm font-medium text-gray-500">{s.vehiclePlate}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-gray-900">{formatDate(s.nextServiceDate)}</p>
                  {s.nextServiceMileage && (
                    <p className="text-gray-500">{formatMileage(s.nextServiceMileage)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {d.urgentAlerts.length > 0 && (
        <Card>
          <CardTitle>Alertas urgentes</CardTitle>
          <div className="mt-4 space-y-3">
            {d.urgentAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <span className="mt-0.5 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm font-medium text-gray-500">{a.message}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">{a.vehiclePlate}</p>
                </div>
                {a.dueDate && (
                  <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                    {formatDate(a.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {d.vehicleCount === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm font-medium leading-6 text-gray-500">
          Comienza registrando tu primer vehículo en{" "}
          <Link href="/vehicles/new" className="font-semibold text-[#d71920] underline">
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
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute right-0 top-0 h-1.5 w-full",
          accent ? "bg-[#d71920]" : "bg-gray-200",
        )}
      />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-bold",
          accent ? "text-[#d71920]" : "text-gray-900",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-gray-500">{note}</p>
    </Card>
  );
}
