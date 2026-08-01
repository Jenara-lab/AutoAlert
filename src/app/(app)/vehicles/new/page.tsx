import { PageHeader } from "@/components/ui/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/app/actions/vehicles";

export default function NewVehiclePage() {
  return (
    <section>
      <PageHeader title="Nuevo vehículo" backHref="/vehicles" />
      <div className="mx-auto max-w-lg">
        <VehicleForm action={createVehicle} />
      </div>
    </section>
  );
}
