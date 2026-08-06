"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  type CreateMaintenanceValues,
  type UpdateMaintenanceValues,
} from "@/lib/validations/maintenance";
import { syncMaintenanceAlert } from "@/lib/alerts/sync";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getMaintenanceRecords(filters?: {
  vehicleId?: string;
  type?: string;
  workshopId?: string;
  from?: string;
  to?: string;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      vehicleId: string;
      workshopId: string | null;
      workshopName: string | null;
      creatorId: string;
      type: string;
      mileage: number;
      serviceDate: string;
      description: string | null;
      costTotal: number | null;
      costLabor: number | null;
      costParts: number | null;
      nextServiceDate: string | null;
      nextServiceMileage: number | null;
      vehiclePlate: string;
      vehicleMake: string;
      vehicleModel: string;
    }>
  >
> {
  await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("maintenance_records")
    .select(
      "id, vehicle_id, workshop_id, creator_id, type, mileage, service_date, description, cost_total, cost_labor, cost_parts, next_service_date, next_service_mileage, vehicles!inner(plate, make, model), workshops(name)",
    )
    .is("deleted_at", null)
    .order("service_date", { ascending: false });

  if (filters?.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.workshopId) query = query.eq("workshop_id", filters.workshopId);
  if (filters?.from) query = query.gte("service_date", filters.from);
  if (filters?.to) query = query.lte("service_date", filters.to);

  const { data, error } = await query;

  if (error) return { error: "No se pudieron cargar los registros." };

  return {
    data: data.map((r) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      workshopId: r.workshop_id,
      workshopName: (r.workshops as unknown as { name: string } | null)?.name ?? null,
      creatorId: r.creator_id,
      type: r.type,
      mileage: r.mileage,
      serviceDate: r.service_date,
      description: r.description,
      costTotal: r.cost_total != null ? Number(r.cost_total) : null,
      costLabor: r.cost_labor != null ? Number(r.cost_labor) : null,
      costParts: r.cost_parts != null ? Number(r.cost_parts) : null,
      nextServiceDate: r.next_service_date,
      nextServiceMileage: r.next_service_mileage,
      vehiclePlate: (r.vehicles as unknown as { plate: string }).plate,
      vehicleMake: (r.vehicles as unknown as { make: string }).make,
      vehicleModel: (r.vehicles as unknown as { model: string }).model,
    })),
  };
}

export async function getMaintenanceRecord(
  id: string,
): Promise< ActionResult<Record<string, unknown>>> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("maintenance_records")
    .select(
      "*, vehicles(plate, make, model, owner_id), workshops(name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return { error: "Registro no encontrado." };
  return { data };
}

export async function createMaintenance(
  values: CreateMaintenanceValues,
): Promise<ActionResult<string>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = createMaintenanceSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const d = parsed.data;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("owner_id")
    .eq("id", d.vehicleId)
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
      .eq("vehicle_id", d.vehicleId)
      .eq("active", true)
      .eq("workshops.mechanic_id", user.id)
      .single();
    if (!hasLink) return { error: "No tienes acceso a este vehículo." };
  }

  if (d.workshopId && d.workshopId.length > 0) {
    const { data: activeLink } = await supabase
      .from("vehicle_workshops")
      .select("id")
      .eq("vehicle_id", d.vehicleId)
      .eq("workshop_id", d.workshopId)
      .eq("active", true)
      .maybeSingle();

    if (!activeLink) {
      return { error: "El taller seleccionado no está vinculado a este vehículo." };
    }
  }

  let computedTotal = d.costTotal ?? null;
  if (computedTotal === null) {
    const labor = d.costLabor ?? 0;
    const parts = d.costParts ?? 0;
    if (labor > 0 || parts > 0) computedTotal = labor + parts;
  }

  const insertData: Record<string, unknown> = {
    vehicle_id: d.vehicleId,
    creator_id: user.id,
    type: d.type,
    mileage: d.mileage,
    service_date: d.serviceDate,
    description: d.description || null,
    cost_total: computedTotal,
    cost_labor: d.costLabor ?? null,
    cost_parts: d.costParts ?? null,
    next_service_date: d.nextServiceDate || null,
    next_service_mileage:
      d.nextServiceMileage != null && d.nextServiceMileage > 0
        ? d.nextServiceMileage
        : null,
  };

  if (d.workshopId && d.workshopId.length > 0) {
    insertData.workshop_id = d.workshopId;
  }

  const { data, error } = await supabase
    .from("maintenance_records")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createMaintenance] insert error:", error);
    if (error.code === "23514") {
      return { error: "El kilometraje no puede ser menor al actual del vehículo." };
    }
    return {
      error: `No se pudo crear el registro: ${error.message || error.code || "error desconocido"}`,
    };
  }

  if (data && (d.nextServiceDate || d.nextServiceMileage != null)) {
    await syncMaintenanceAlert(supabase, {
      id: data.id,
      vehicle_id: d.vehicleId,
      type: d.type,
      next_service_date: d.nextServiceDate || null,
      next_service_mileage: d.nextServiceMileage ?? null,
    });
  }

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${d.vehicleId}`);
  return { data: data.id };
}

export async function updateMaintenance(
  id: string,
  values: UpdateMaintenanceValues,
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = updateMaintenanceSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const d = parsed.data;
  const labor = d.costLabor ?? 0;
  const parts = d.costParts ?? 0;
  const hasLabor = labor > 0;
  const hasParts = parts > 0;
  if ((hasLabor || hasParts) && d.costTotal !== undefined && d.costTotal !== labor + parts) {
    return { error: "Si indicas mano de obra o repuestos, el total debe ser igual a su suma." };
  }

  const { data: existing } = await supabase
    .from("maintenance_records")
    .select("id, creator_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) return { error: "Registro no encontrado." };
  if (existing.creator_id !== user.id)
    return { error: "No tienes permiso para editar este registro." };

  const updateData: Record<string, unknown> = {};
  if (d.vehicleId !== undefined) updateData.vehicle_id = d.vehicleId;
  if (d.workshopId !== undefined)
    updateData.workshop_id = d.workshopId || null;
  if (d.type !== undefined) updateData.type = d.type;
  if (d.mileage !== undefined) updateData.mileage = d.mileage;
  if (d.serviceDate !== undefined) updateData.service_date = d.serviceDate;
  if (d.description !== undefined) updateData.description = d.description || null;
  if (d.costTotal !== undefined) updateData.cost_total = d.costTotal ?? null;
  if (d.costLabor !== undefined) updateData.cost_labor = d.costLabor ?? null;
  if (d.costParts !== undefined) updateData.cost_parts = d.costParts ?? null;
  if (d.nextServiceDate !== undefined)
    updateData.next_service_date = d.nextServiceDate || null;
  if (d.nextServiceMileage !== undefined)
    updateData.next_service_mileage =
      d.nextServiceMileage != null && d.nextServiceMileage > 0
        ? d.nextServiceMileage
        : null;

  if (Object.keys(updateData).length === 0) return { data: undefined };

  const { error } = await supabase
    .from("maintenance_records")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[updateMaintenance] update error:", error);
    return {
      error: `No se pudo actualizar el registro: ${error.message || error.code || "error desconocido"}`,
    };
  }

  if (d.nextServiceDate !== undefined || d.nextServiceMileage !== undefined || d.type !== undefined) {
    const { data: record } = await supabase
      .from("maintenance_records")
      .select("id, vehicle_id, type, next_service_date, next_service_mileage")
      .eq("id", id)
      .single();

    if (record) {
      await syncMaintenanceAlert(supabase, {
        id: record.id,
        vehicle_id: record.vehicle_id,
        type: record.type,
        next_service_date: record.next_service_date,
        next_service_mileage: record.next_service_mileage,
      });
    }
  }

  revalidatePath("/history");
  revalidatePath(`/history/${id}`);
  return { data: undefined };
}

export async function deleteMaintenance(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("maintenance_records")
    .select("id, creator_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) return { error: "Registro no encontrado." };
  if (existing.creator_id !== user.id)
    return { error: "No tienes permiso para eliminar este registro." };

  const { error } = await supabase
    .from("maintenance_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "No se pudo eliminar el registro." };

  revalidatePath("/history");
  return { data: undefined };
}
