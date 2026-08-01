import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { OperatingExpenseForm } from "@/components/expenses/operating-expense-form";

export default async function ExpenseFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <section>
      <PageHeader
        title="Gasto operativo"
        backHref={`/vehicles/${id}`}
      />
      <div className="mx-auto max-w-lg">
        <OperatingExpenseForm vehicleId={id} />
      </div>
    </section>
  );
}
