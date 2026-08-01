import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { WorkshopCard } from "@/components/workshops/workshop-card";
import { getWorkshops } from "@/app/actions/workshops";
import { requireAuth } from "@/lib/permissions/auth";

export default async function WorkshopsPage() {
  const user = await requireAuth();
  const result = await getWorkshops();

  if ("error" in result) {
    return (
      <section>
        <PageHeader title="Talleres" />
        <EmptyState title="Error" description={result.error} />
      </section>
    );
  }

  const workshops = result.data;
  const canCreateWorkshop = user.role === "mechanic" || user.role === "owner";

  return (
    <section>
      <PageHeader
        title={user.role === "mechanic" ? "Mis Talleres" : "Talleres"}
        subtitle={`${workshops.length} taller${workshops.length !== 1 ? "es" : ""}`}
        action={
          canCreateWorkshop ? (
            <ButtonLink href="/workshops/new" variant="primary">
              + Nuevo
            </ButtonLink>
          ) : undefined
        }
      />

      {workshops.length === 0 ? (
        <EmptyState
          title="Sin talleres"
          description={
            canCreateWorkshop
              ? "Crea tu primer taller para comenzar."
              : "No hay talleres disponibles."
          }
          action={
            canCreateWorkshop ? (
              <ButtonLink href="/workshops/new" variant="primary">
                Crear taller
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workshops.map((w) => (
            <WorkshopCard key={w.id} {...w} />
          ))}
        </div>
      )}
    </section>
  );
}
