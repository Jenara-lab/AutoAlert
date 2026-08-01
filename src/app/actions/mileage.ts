"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import { createMileageSchema, type CreateMileageValues } from "@/lib/validations/mileage";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getMileageLogs(vehicleId: string): Promise<ActionResult<Array<{
  id: string; mileage: number; date: string; note: string | null; recorderId: string;
  createdAt: string;
}>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mileage_logs")
    .select("id, mileage, date, note, recorder_id, created_at")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false });

  if (error) return { error: "No se pudieron cargar los registros de kilometraje." };

  return {
    data: data.map((l) => ({
      id: l.id,
      mileage: l.mileage,
      date: l.date,
      note: l.note,
      recorderId: l.recorder_id,
      createdAt: l.created_at,
    })),
  };
}

export async function addMileageLog(
  vehicleId: string,
  values: CreateMileageValues,
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = createMileageSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("current_mileage, owner_id")
    .eq("id", vehicleId)
    .is("deleted_at", null)
    .single();

  if (!vehicle) return { error: "Vehículo no encontrado." };

  if (user.role === "owner" && vehicle.owner_id !== user.id) {
    return { error: "No tienes acceso a este vehículo." };
  }

  if (user.role === "mechanic") {
    const { data: hasLink } = await supabase
      .from("vehicle_workshops")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("active", true)
      .eq("workshops.mechanic_id", user.id)
      .single();
    if (!hasLink) return { error: "No tienes acceso a este vehículo." };
  }

  if (parsed.data.mileage < vehicle.current_mileage) {
    return {
      error: `El kilometraje no puede ser menor al actual (${vehicle.current_mileage.toLocaleString()} km).`,
    };
  }

  const { error } = await supabase.from("mileage_logs").insert({
    vehicle_id: vehicleId,
    recorder_id: user.id,
    mileage: parsed.data.mileage,
    date: parsed.data.date,
    note: parsed.data.note || null,
  });

  if (error) {
    if (error.code === "23514") {
      return { error: "El kilometraje no puede ser menor al actual." };
    }
    return { error: "No se pudo registrar el kilometraje." };
  }

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/vehicles");
  return { data: undefined };
}

export async function deleteMileageLog(
  vehicleId: string,
  logId: string,
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("mileage_logs")
    .delete()
    .eq("id", logId)
    .eq("vehicle_id", vehicleId)
    .eq("recorder_id", user.id);

  if (error) return { error: "No se pudo eliminar el registro." };

  revalidatePath(`/vehicles/${vehicleId}`);
  return { data: undefined };
}
