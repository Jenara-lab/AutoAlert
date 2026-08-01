"use client";

import { useEffect, useState } from "react";
import { getVehicleWorkshops } from "@/app/actions/vehicle-workshops";

type WorkshopOption = {
  id: string;
  workshopId: string;
  workshopName: string;
  active: boolean;
};

export function WorkshopSelector({
  vehicleId,
  value,
  onChange,
  error,
  label = "Taller",
  required = false,
}: {
  vehicleId: string;
  value: string;
  onChange: (id: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}) {
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getVehicleWorkshops(vehicleId).then((result) => {
      if (!mounted) return;
      if ("data" in result && result.data) {
        setWorkshops(result.data);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [vehicleId]);

  const emptyLabel = loading
    ? "Cargando talleres…"
    : workshops.length === 0
      ? "No hay talleres vinculados"
      : required
        ? "Selecciona un taller"
        : "Sin taller";

  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      {required && <span className="ml-1 text-[#DC2626]">*</span>}
      <select
        required={required}
        disabled={loading || (required && workshops.length === 0)}
        className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#D71920] focus:ring-2 focus:ring-[#DC2626]/20 disabled:bg-[#F7F7F8]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {workshops.map((w) => (
          <option key={w.id} value={w.workshopId}>
            {w.workshopName}
          </option>
        ))}
      </select>
      {!loading && workshops.length === 0 && (
        <span className="mt-1 block text-xs text-[#6B7280]">
          Vincula un taller al vehículo para asociarlo a este servicio.
        </span>
      )}
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
