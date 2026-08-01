import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { WorkshopForm } from "@/components/workshops/workshop-form";
import { getWorkshop } from "@/app/actions/workshops";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkshop(id);

  if ("error" in result) notFound();

  const workshop = result.data as {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    manager: string | null;
  };

  return (
    <section>
      <PageHeader title="Editar taller" backHref={`/workshops/${id}`} />
      <div className="mx-auto max-w-lg">
        <WorkshopForm
          id={id}
          defaultValues={{
            name: workshop.name,
            address: workshop.address ?? undefined,
            phone: workshop.phone ?? undefined,
            manager: workshop.manager ?? undefined,
          }}
          mode="edit"
        />
      </div>
    </section>
  );
}
