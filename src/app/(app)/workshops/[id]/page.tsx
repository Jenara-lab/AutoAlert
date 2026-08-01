import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getWorkshop } from "@/app/actions/workshops";
import { getWorkshopVehicles } from "@/app/actions/vehicle-workshops";
import { requireAuth } from "@/lib/permissions/auth";
import { formatMileage } from "@/lib/utils/format";

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const [workshopResult, vehiclesResult] = await Promise.all([
    getWorkshop(id),
    getWorkshopVehicles(id),
  ]);

  if ("error" in workshopResult) notFound();

  const workshop = workshopResult.data as unknown as {
    id: string; name: string; address: string | null;
    phone: string | null; manager: string | null; mechanic_id: string;
    created_at: string;
  };

  const vehicles = "data" in vehiclesResult && vehiclesResult.data ? vehiclesResult.data : [];
  const isCreator = workshop.mechanic_id === user.id;

  return (
    <section className="space-y-6">
      <PageHeader
        title={workshop.name}
        backHref="/workshops"
        action={
          isCreator ? (
            <ButtonLink href={`/workshops/${id}/edit`} variant="secondary">
              Editar
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-lg space-y-4">
        {workshop.address && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-sm text-[#6B7280]">Dirección</p>
            <p className="mt-1 font-medium text-[#111111]">{workshop.address}</p>
          </div>
        )}
        {workshop.phone && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-sm text-[#6B7280]">Teléfono</p>
            <p className="mt-1 font-medium text-[#111111]">{workshop.phone}</p>
          </div>
        )}
        {workshop.manager && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-sm text-[#6B7280]">Encargado</p>
            <p className="mt-1 font-medium text-[#111111]">{workshop.manager}</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#111111]">Vehículos vinculados</h2>
        {vehicles.length > 0 ? (
          <div className="mt-3 space-y-2">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 transition hover:border-[#d71920]"
              >
                <div>
                  <p className="text-sm font-medium text-[#111111]">
                    {v.make} {v.model}
                  </p>
                  <p className="text-xs text-[#6B7280]">{v.year} · {v.plate}</p>
                </div>
                <span className="text-sm font-medium text-[#6B7280]">
                  {formatMileage(v.currentMileage)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              title="Sin vehículos vinculados"
              description="Ningún propietario ha vinculado un vehículo a este taller todavía."
            />
          </div>
        )}
      </div>
    </section>
  );
}
