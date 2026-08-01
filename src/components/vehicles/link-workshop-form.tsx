"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkWorkshop } from "@/app/actions/vehicle-workshops";

export function LinkWorkshopForm({
  vehicleId,
  workshops,
}: {
  vehicleId: string;
  workshops: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLink(workshopId: string) {
    startTransition(async () => {
      await linkWorkshop(vehicleId, workshopId);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {workshops.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
        >
          <span className="text-sm font-medium text-[#111111]">{w.name}</span>
          <button
            className="rounded-lg bg-[#d71920] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a80f16] disabled:opacity-60"
            onClick={() => handleLink(w.id)}
            disabled={pending}
          >
            Vincular
          </button>
        </div>
      ))}
    </div>
  );
}
