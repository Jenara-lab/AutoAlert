import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getVehicles } from "@/app/actions/vehicles";
import { requireAuth } from "@/lib/permissions/auth";

export default async function VehiclesPage() {
  const user = await requireAuth();
  const result = await getVehicles();

  if ("error" in result) {
    return (
      <section>
        <PageHeader title="Mis Vehículos" />
        <EmptyState title="Error" description={result.error} />
      </section>
    );
  }

  const vehicles = result.data;
  const isOwner = user.role === "owner";

  return (
    <section>
      <PageHeader
        title="Mis Vehículos"
        subtitle={`${vehicles.length} vehículo${vehicles.length !== 1 ? "s" : ""}`}
        action={
          isOwner ? (
            <ButtonLink href="/vehicles/new" variant="primary">
              + Nuevo
            </ButtonLink>
          ) : undefined
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          title="Sin vehículos"
          description={
            isOwner
              ? "Registra tu primer vehículo para comenzar."
              : "No tienes vehículos vinculados a tus talleres."
          }
          action={
            isOwner ? (
              <ButtonLink href="/vehicles/new" variant="primary">
                Registrar vehículo
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} {...v} />
          ))}
        </div>
      )}
    </section>
  );
}
