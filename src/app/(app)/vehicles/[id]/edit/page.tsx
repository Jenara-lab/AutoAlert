import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { getVehicle, updateVehicle } from "@/app/actions/vehicles";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVehicle(id);

  if ("error" in result) notFound();

  const vehicle = result.data as unknown as {
    plate: string; make: string; model: string; year: number;
    vin: string | null; fuel_type: string;
  };

  return (
    <section>
      <PageHeader title="Editar vehículo" backHref={`/vehicles/${id}`} />
      <div className="mx-auto max-w-lg">
        <VehicleForm
          action={(values) => updateVehicle(id, values)}
          defaultValues={{
            plate: vehicle.plate,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin ?? "",
            fuelType: vehicle.fuel_type,
          }}
          mode="edit"
        />
      </div>
    </section>
  );
}
