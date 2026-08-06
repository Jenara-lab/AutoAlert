"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import {
  createVehicleSchema,
  updateVehicleSchema,
  type CreateVehicleValues,
  type UpdateVehicleValues,
} from "@/lib/validations/vehicles";
import { normalizePlate } from "@/lib/utils/format";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getVehicles(): Promise<ActionResult<Array<{
  id: string; plate: string; make: string; model: string; year: number;
  currentMileage: number; fuelType: string; normalizedPlate: string;
}>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("vehicles")
    .select("id, plate, make, model, year, current_mileage, fuel_type, normalized_plate")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (user.role === "owner") {
    query = query.eq("owner_id", user.id);
  }

  const { data, error } = await query;

  if (error) return { error: "No se pudieron cargar los vehículos." };
  return { data: data.map((v) => ({
    id: v.id,
    plate: v.plate,
    make: v.make,
    model: v.model,
    year: v.year,
    currentMileage: v.current_mileage,
    fuelType: v.fuel_type,
    normalizedPlate: v.normalized_plate,
  }))};
}

export async function getVehicle(id: string): Promise<ActionResult<Record<string, unknown>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return { error: "Vehículo no encontrado." };

  if (user.role === "owner" && data.owner_id !== user.id) {
    return { error: "No tienes acceso a este vehículo." };
  }

  if (user.role === "mechanic") {
    const { data: hasLink } = await supabase
      .from("vehicle_workshops")
      .select("id, workshops!inner(mechanic_id)")
      .eq("vehicle_id", id)
      .eq("active", true)
      .eq("workshops.mechanic_id", user.id)
      .single();

    if (!hasLink) return { error: "No tienes acceso a este vehículo." };
  }

  return { data };
}

export async function createVehicle(values: CreateVehicleValues): Promise<ActionResult<string>> {
  const user = await requireAuth();
  if (user.role !== "owner") return { error: "Solo los propietarios pueden crear vehículos." };

  const parsed = createVehicleSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await createClient();
  const normalized = normalizePlate(parsed.data.plate);
  const vin = parsed.data.vin ? parsed.data.vin.toUpperCase() : null;

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: user.id,
      plate: parsed.data.plate,
      normalized_plate: normalized,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      vin,
      fuel_type: parsed.data.fuelType,
      current_mileage: parsed.data.currentMileage ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ya tienes un vehículo con esa placa." };
    if (error.code === "23514") return { error: "Revisa los datos del vehículo." };
    return { error: error.message ?? "No se pudo crear el vehículo." };
  }

  revalidatePath("/vehicles");
  return { data: data.id };
}

export async function updateVehicle(
  id: string,
  values: UpdateVehicleValues,
): Promise<ActionResult> {
  const user = await requireAuth();
  if (user.role !== "owner") return { error: "Solo los propietarios pueden editar vehículos." };

  const parsed = updateVehicleSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await createClient();

  const { data: existing, error: checkError } = await supabase
    .from("vehicles")
    .select("id, current_mileage")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .single();

  if (checkError || !existing) return { error: "Vehículo no encontrado." };

  if (
    parsed.data.currentMileage !== undefined &&
    parsed.data.currentMileage < existing.current_mileage
  ) {
    return { error: "El kilometraje no puede ser menor al actual del vehículo." };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.plate !== undefined) {
    updateData.plate = parsed.data.plate;
    updateData.normalized_plate = normalizePlate(parsed.data.plate);
  }
  if (parsed.data.make !== undefined) updateData.make = parsed.data.make;
  if (parsed.data.model !== undefined) updateData.model = parsed.data.model;
  if (parsed.data.year !== undefined) updateData.year = parsed.data.year;
  if (parsed.data.vin !== undefined) updateData.vin = parsed.data.vin.toUpperCase() || null;
  if (parsed.data.fuelType !== undefined) updateData.fuel_type = parsed.data.fuelType;
  if (parsed.data.currentMileage !== undefined)
    updateData.current_mileage = parsed.data.currentMileage;

  if (Object.keys(updateData).length === 0) return { data: undefined };

  const { error } = await supabase.from("vehicles").update(updateData).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ya tienes un vehículo con esa placa." };
    return { error: "No se pudo actualizar el vehículo." };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
  return { data: undefined };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (user.role !== "owner") return { error: "Solo los propietarios pueden eliminar vehículos." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if (error) return { error: "No se pudo eliminar el vehículo." };

  revalidatePath("/vehicles");
  return { data: undefined };
}
