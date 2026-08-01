"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getVehicles } from "@/app/actions/vehicles";
import Link from "next/link";

export default function AddPage() {
  return <AddPageInner />;
}

function AddPageInner() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string; make: string; model: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    getVehicles().then((result) => {
      if ("data" in result && result.data) setVehicles(result.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section>
        <PageHeader title="Registrar" backHref="/dashboard" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
          ))}
        </div>
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section>
        <PageHeader title="Registrar" backHref="/dashboard" />
        <EmptyState
          title="Sin vehículos"
          description="Primero registra un vehículo para poder agregar servicios o gastos."
          action={
            <Link
              className="rounded-xl bg-[#d71920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a80f16]"
              href="/vehicles/new"
            >
              Registrar vehículo
            </Link>
          }
        />
      </section>
    );
  }

  if (!selectedVehicle) {
    return (
      <section>
        <PageHeader title="Selecciona un vehículo" backHref="/dashboard" />
        <div className="mx-auto max-w-lg space-y-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              className="w-full text-left rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#d71920] hover:shadow-md"
              onClick={() => setSelectedVehicle(v.id)}
            >
              <p className="font-semibold text-[#111111]">
                {v.make} {v.model}
              </p>
              <p className="text-sm text-[#6B7280]">{v.plate}</p>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="¿Qué deseas registrar?" backHref="/dashboard" />
      <div className="mx-auto max-w-lg space-y-3">
        <AddOption
          href={`/vehicles/${selectedVehicle}/maintenance`}
          title="Servicio / Reparación"
          description="Cambio de aceite, frenos, llantas, afinamiento u otro."
          icon="🔧"
        />
        <AddOption
          href={`/vehicles/${selectedVehicle}/expenses/new`}
          title="Gasto operativo"
          description="Combustible, seguro o revisión vehicular."
          icon="⛽"
        />
        <AddOption
          href={`/vehicles/${selectedVehicle}/mileage`}
          title="Actualizar kilometraje"
          description="Registra la lectura actual del odómetro."
          icon="📏"
        />
      </div>
    </section>
  );
}

function AddOption({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#d71920] hover:shadow-md"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-[#111111]">{title}</p>
        <p className="text-sm text-[#6B7280]">{description}</p>
      </div>
    </Link>
  );
}
