"use client";

import { useState } from "react";
import Link from "next/link";
import { sendTestWhatsAppReminder } from "@/app/actions/notifications";
import type { TestSendStatus } from "@/app/actions/notifications";
import { formatDate, formatMileage } from "@/lib/utils/format";

export type UpcomingService = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  currentMileage: number;
  nextServiceDate: string;
  nextServiceMileage: number | null;
  kind: "maintenance_date" | "maintenance_mileage" | "insurance_expiry" | "registration_expiry";
  type: string;
  typeLabel: string;
};

const STATUS_TEXT: Record<TestSendStatus, string> = {
  sent: "Enviado correctamente.",
  error: "Error al enviar.",
  invalid_number: "Número inválido.",
  no_phone: "Sin teléfono configurado.",
  disabled: "WhatsApp deshabilitado.",
};

function notificationKindFromAlertKind(
  service: UpcomingService,
): "maintenance" | "insurance" | "registration" | "mileage" {
  switch (service.kind) {
    case "maintenance_date":
      return "maintenance";
    case "maintenance_mileage":
      return "mileage";
    case "insurance_expiry":
      return "insurance";
    case "registration_expiry":
      return "registration";
  }
}

export function UpcomingServiceList({ services }: { services: UpcomingService[] }) {
  const [statusById, setStatusById] = useState<
    Record<string, { text: string; tone: "success" | "error" | "neutral" }>
  >({});
  const [loadingById, setLoadingById] = useState<Record<string, boolean>>({});

  if (services.length === 0) return null;

  async function handleSendTest(service: UpcomingService) {
    setLoadingById((prev) => ({ ...prev, [service.id]: true }));
    setStatusById((prev) => ({ ...prev, [service.id]: { text: "", tone: "neutral" } }));

    const result = await sendTestWhatsAppReminder(notificationKindFromAlertKind(service), {
      vehicle: {
        make: service.vehicleMake,
        model: service.vehicleModel,
        plate: service.vehiclePlate,
      },
      dueDate: service.nextServiceDate,
      dueMileage: service.nextServiceMileage,
      currentMileage: service.currentMileage,
      serviceType: service.type,
      serviceLabel: service.typeLabel,
    });

    setLoadingById((prev) => ({ ...prev, [service.id]: false }));
    setStatusById((prev) => ({
      ...prev,
      [service.id]: {
        text: result.error || STATUS_TEXT[result.status] || "Error al enviar mensaje.",
        tone: result.status === "sent" ? "success" : "error",
      },
    }));
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Servicios próximos</h2>
      <div className="mt-4 divide-y divide-[#E5E7EB]">
        {services.map((s) => {
          const status = statusById[s.id];
          const loading = loadingById[s.id];

          return (
            <div
              key={s.id}
              className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link
                href={`/vehicles/${s.vehicleId}`}
                className="flex-1 hover:opacity-80"
              >
                <p className="font-medium">
                  {s.vehicleMake} {s.vehicleModel}
                </p>
                <p className="text-sm text-[#6B7280]">
                  {s.vehiclePlate}
                  {s.typeLabel ? ` · ${s.typeLabel}` : ""}
                </p>
              </Link>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {s.nextServiceDate && !isNaN(new Date(s.nextServiceDate + "T00:00:00").getTime())
                      ? formatDate(s.nextServiceDate)
                      : s.nextServiceMileage != null
                        ? "Por kilometraje"
                        : "Próximo"}
                  </p>
                  {s.nextServiceMileage != null && (
                    <p className="text-[#6B7280]">
                      {formatMileage(s.nextServiceMileage)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSendTest(s)}
                  className="rounded-full bg-[#d71920] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#a80f16] disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar mensaje de prueba"}
                </button>
                {status?.text && (
                  <p
                    className={`text-xs ${
                      status.tone === "success"
                        ? "text-green-600"
                        : "text-[#DC2626]"
                    }`}
                  >
                    {status.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
