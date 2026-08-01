import { PageHeader } from "@/components/ui/page-header";
import { WorkshopForm } from "@/components/workshops/workshop-form";

export default function NewWorkshopPage() {
  return (
    <section>
      <PageHeader title="Nuevo taller" backHref="/workshops" />
      <div className="mx-auto max-w-lg">
        <WorkshopForm mode="create" />
      </div>
    </section>
  );
}
