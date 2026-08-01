import { PageHeader } from "@/components/ui/page-header";
import { WorkshopForm } from "@/components/workshops/workshop-form";
import { createWorkshop } from "@/app/actions/workshops";

export default function NewWorkshopPage() {
  return (
    <section>
      <PageHeader title="Nuevo taller" backHref="/workshops" />
      <div className="mx-auto max-w-lg">
        <WorkshopForm action={createWorkshop} />
      </div>
    </section>
  );
}
