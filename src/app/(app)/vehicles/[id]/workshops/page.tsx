import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getVehicleWorkshops } from "@/app/actions/vehicle-workshops";
import { getActiveWorkshops } from "@/app/actions/workshops";
import { LinkWorkshopForm } from "@/components/vehicles/link-workshop-form";
import { requireAuth } from "@/lib/permissions/auth";

export default async function VehicleWorkshopsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const [linkedResult, activeResult] = await Promise.all([
    getVehicleWorkshops(id),
    getActiveWorkshops(),
  ]);

  const linked = "data" in linkedResult && linkedResult.data ? linkedResult.data : [];
  const active = "data" in activeResult && activeResult.data ? activeResult.data : [];

  const unlinked = active.filter(
    (w) => !linked.some((l) => l.workshopId === w.id),
  );

  return (
    <section>
      <PageHeader title="Talleres vinculados" backHref={`/vehicles/${id}`} />

      {linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[#111111]">{w.workshopName}</p>
              </div>
              <StatusBadge variant={w.active ? "success" : "muted"}>
                {w.active ? "Activo" : "Inactivo"}
              </StatusBadge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin talleres vinculados"
          description="Vincula un taller para que aparezcan los servicios realizados."
        />
      )}

      {user.role === "owner" && unlinked.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#111111]">Vincular taller</h2>
          <LinkWorkshopForm vehicleId={id} workshops={unlinked} />
        </div>
      )}
    </section>
  );
}
