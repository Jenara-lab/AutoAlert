"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import { z } from "zod";

const linkWorkshopSchema = z.object({
  vehicleId: z.string().uuid(),
  workshopId: z.string().uuid(),
});

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getVehicleWorkshops(vehicleId: string): Promise<ActionResult<Array<{
  id: string; workshopId: string; workshopName: string; active: boolean;
}>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("vehicle_workshops")
    .select("id, workshop_id, active, workshops!inner(name, mechanic_id)")
    .eq("vehicle_id", vehicleId)
    .eq("active", true);

  if (user.role === "mechanic") {
    query = query.eq("workshops.mechanic_id", user.id);
  }

  const { data, error } = await query;

  if (error) return { error: "No se pudieron cargar los talleres vinculados." };

  return {
    data: data.map((vw) => ({
      id: vw.id,
      workshopId: vw.workshop_id,
      workshopName: (vw.workshops as unknown as { name: string }).name,
      active: vw.active,
    })),
  };
}

export async function getWorkshopVehicles(workshopId: string): Promise<ActionResult<Array<{
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
  active: boolean;
}>>> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicle_workshops")
    .select("id, active, vehicles!inner(id, plate, make, model, year, current_mileage)")
    .eq("workshop_id", workshopId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return { error: "No se pudieron cargar los vehículos vinculados." };

  return {
    data: data.map((vw) => {
      const v = vw.vehicles as unknown as {
        id: string;
        plate: string;
        make: string;
        model: string;
        year: number;
        current_mileage: number;
      };
      return {
        id: v.id,
        plate: v.plate,
        make: v.make,
        model: v.model,
        year: v.year,
        currentMileage: v.current_mileage,
        active: vw.active,
      };
    }),
  };
}

export async function linkWorkshop(
  vehicleId: string,
  workshopId: string,
): Promise<ActionResult> {
  const parsed = linkWorkshopSchema.safeParse({ vehicleId, workshopId });
  if (!parsed.success) return { error: "Datos inválidos." };

  const user = await requireAuth();
  const supabase = await createClient();

  if (user.role === "owner") {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!vehicle) return { error: "Vehículo no encontrado." };
  }

  const { error } = await supabase.from("vehicle_workshops").upsert(
    { vehicle_id: vehicleId, workshop_id: workshopId, active: true },
    { onConflict: "vehicle_id,workshop_id" },
  );

  if (error) return { error: "No se pudo vincular el taller." };

  revalidatePath(`/vehicles/${vehicleId}`);
  return { data: undefined };
}

export async function unlinkWorkshop(
  vehicleId: string,
  workshopId: string,
): Promise<ActionResult> {
  const parsed = linkWorkshopSchema.safeParse({ vehicleId, workshopId });
  if (!parsed.success) return { error: "Datos inválidos." };

  const user = await requireAuth();
  const supabase = await createClient();

  if (user.role === "owner") {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!vehicle) return { error: "Vehículo no encontrado." };
  }

  const { error } = await supabase
    .from("vehicle_workshops")
    .update({ active: false })
    .eq("vehicle_id", vehicleId)
    .eq("workshop_id", workshopId);

  if (error) return { error: "No se pudo desvincular el taller." };

  revalidatePath(`/vehicles/${vehicleId}`);
  return { data: undefined };
}

export async function deactivateWorkshopLink(
  linkId: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  if (user.role === "owner") {
    const { data: link } = await supabase
      .from("vehicle_workshops")
      .select("id, vehicles!inner(owner_id)")
      .eq("id", linkId)
      .single();

    if (!link || (link.vehicles as unknown as { owner_id: string }).owner_id !== user.id) {
      return { error: "No tienes acceso a este vínculo." };
    }
  }

  const { error } = await supabase
    .from("vehicle_workshops")
    .update({ active: false })
    .eq("id", linkId);

  if (error) return { error: "No se pudo desactivar el vínculo." };

  revalidatePath("/vehicles");
  return { data: undefined };
}
