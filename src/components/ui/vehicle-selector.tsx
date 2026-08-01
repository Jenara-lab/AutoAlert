"use client";

import { useEffect, useState } from "react";
import { getVehicles } from "@/app/actions/vehicles";

type VehicleOption = {
  id: string;
  plate: string;
  make: string;
  model: string;
};

export function VehicleSelector({
  value,
  onChange,
  error,
  label = "Vehículo",
}: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
  label?: string;
}) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicles().then((result) => {
      if ("data" in result && result.data) {
        setVehicles(result.data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#D71920] focus:ring-2 focus:ring-[#DC2626]/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? "Cargando vehículos…" : "Selecciona un vehículo"}</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.make} {v.model} · {v.plate}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
