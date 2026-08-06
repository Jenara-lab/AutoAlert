import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { getVehicle, updateVehicle } from "@/app/actions/vehicles";
import type { UpdateVehicleValues } from "@/lib/validations/vehicles";

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
    vin: string | null; fuel_type: string; current_mileage: number;
  };

  async function handleUpdate(values: UpdateVehicleValues) {
    "use server";
    return updateVehicle(id, values);
  }

  return (
    <section>
      <PageHeader title="Editar vehículo" backHref={`/vehicles/${id}`} />
      <div className="mx-auto max-w-lg">
        <VehicleForm
          action={handleUpdate}
          defaultValues={{
            plate: vehicle.plate,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin ?? "",
            fuelType: vehicle.fuel_type,
            currentMileage: vehicle.current_mileage,
          }}
          mode="edit"
        />
      </div>
    </section>
  );
}
