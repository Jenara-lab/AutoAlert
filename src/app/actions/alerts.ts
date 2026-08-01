"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getAlerts(filters?: {
  status?: string;
  kind?: string;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      title: string;
      message: string;
      kind: string;
      channel: string;
      status: string;
      dueDate: string | null;
      dueMileage: number | null;
      vehicleId: string;
      vehiclePlate: string;
      vehicleMake: string;
      vehicleModel: string;
      createdAt: string;
      readAt: string | null;
    }>
  >
> {
  const user = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("alerts")
    .select(
      "id, title, message, kind, channel, status, due_date, due_mileage, vehicle_id, created_at, read_at, vehicles!inner(plate, make, model)"
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.kind) query = query.eq("kind", filters.kind);

  const { data, error } = await query;

  if (error) return { error: "No se pudieron cargar las alertas." };

  return {
    data: data.map((a) => {
      const v = a.vehicles as unknown as {
        plate: string;
        make: string;
        model: string;
      };
      return {
        id: a.id,
        title: a.title,
        message: a.message,
        kind: a.kind,
        channel: a.channel,
        status: a.status,
        dueDate: a.due_date,
        dueMileage: a.due_mileage,
        vehicleId: a.vehicle_id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        createdAt: a.created_at,
        readAt: a.read_at,
      };
    }),
  };
}

export async function markAlertAsRead(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return { error: "No se pudo marcar la alerta como leída." };
  return { data: undefined };
}

export async function markAllAlertsAsRead(): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "No se pudieron marcar las alertas." };
  return { data: undefined };
}

export async function getAlertStats(): Promise<
  ActionResult<{ pending: number; total: number }>
> {
  const user = await requireAuth();
  const supabase = await createClient();

  const [pendingResult, totalResult] = await Promise.all([
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id),
  ]);

  return {
    data: {
      pending: pendingResult.count ?? 0,
      total: totalResult.count ?? 0,
    },
  };
}

export type UpcomingAlertItem = {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  currentMileage: number;
  kind: "maintenance_date" | "maintenance_mileage" | "insurance_expiry" | "registration_expiry";
  title: string;
  dueDate: string | null;
  dueMileage: number | null;
  type: string;
  typeLabel: string;
  source: "maintenance" | "expense";
};

export async function getUpcomingAlerts(): Promise<
  ActionResult<UpcomingAlertItem[]>
> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id, plate, make, model, current_mileage, owner_id")
    .is("deleted_at", null);

  if (vehiclesError) return { error: "No se pudieron cargar los vehículos." };

  const ownedVehicles = (vehicles ?? []).filter((v) => v.owner_id === user.id);
  const vehicleIds = ownedVehicles.map((v) => v.id);

  if (vehicleIds.length === 0) return { data: [] };

  const today = new Date().toISOString().split("T")[0];

  const [maintenanceResult, expensesResult] = await Promise.all([
    supabase
      .from("maintenance_records")
      .select("id, vehicle_id, type, next_service_date, next_service_mileage")
      .is("deleted_at", null)
      .in("vehicle_id", vehicleIds)
      .or("next_service_date.gte." + today + ",next_service_mileage.not.is.null"),
    supabase
      .from("operating_expenses")
      .select("id, vehicle_id, type, due_date")
      .is("deleted_at", null)
      .in("vehicle_id", vehicleIds)
      .in("type", ["insurance", "registration"])
      .not("due_date", "is", null)
      .gte("due_date", today),
  ]);

  const vehicleMap = new Map(
    ownedVehicles.map((v) => [
      v.id,
      {
        plate: v.plate,
        make: v.make,
        model: v.model,
        currentMileage: v.current_mileage,
      },
    ]),
  );

  const TYPE_LABELS: Record<string, string> = {
    oil_change: "Cambio de aceite",
    filter_change: "Cambio de filtro",
    brake_change: "Cambio de frenos",
    tire_change: "Cambio de llantas",
    battery_change: "Cambio de batería",
    tune_up: "Afinamiento",
    general_repair: "Reparación general",
  };

  const items: UpcomingAlertItem[] = [];

  if (maintenanceResult.data) {
    for (const m of maintenanceResult.data) {
      const v = vehicleMap.get(m.vehicle_id);
      if (!v) continue;
      const label = TYPE_LABELS[m.type] ?? m.type;

      if (m.next_service_date) {
        items.push({
          id: `${m.id}-maintenance-date`,
          vehicleId: m.vehicle_id,
          vehiclePlate: v.plate,
          vehicleMake: v.make,
          vehicleModel: v.model,
          currentMileage: v.currentMileage,
          kind: "maintenance_date",
          title: `Próximo servicio: ${label}`,
          dueDate: m.next_service_date,
          dueMileage: null,
          type: m.type,
          typeLabel: label,
          source: "maintenance",
        });
      }

      if (m.next_service_mileage != null) {
        items.push({
          id: `${m.id}-maintenance-mileage`,
          vehicleId: m.vehicle_id,
          vehiclePlate: v.plate,
          vehicleMake: v.make,
          vehicleModel: v.model,
          currentMileage: v.currentMileage,
          kind: "maintenance_mileage",
          title: `Kilometraje: ${label}`,
          dueDate: null,
          dueMileage: m.next_service_mileage,
          type: m.type,
          typeLabel: label,
          source: "maintenance",
        });
      }
    }
  }

  if (expensesResult.data) {
    for (const e of expensesResult.data) {
      const v = vehicleMap.get(e.vehicle_id);
      if (!v) continue;
      const isInsurance = e.type === "insurance";
      const label = isInsurance ? "Seguro" : "Revisión vehicular";
      items.push({
        id: `${e.id}-${e.type}`,
        vehicleId: e.vehicle_id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        currentMileage: v.currentMileage,
        kind: isInsurance ? "insurance_expiry" : "registration_expiry",
        title: `${label} por vencer`,
        dueDate: e.due_date,
        dueMileage: null,
        type: e.type,
        typeLabel: label,
        source: "expense",
      });
    }
  }

  items.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return { data: items };
}

export async function generateAlertsNow(): Promise<
  ActionResult<{ created: number; updated: number; skipped: number }>
> {
  await requireAuth();
  const { processAlerts } = await import("@/lib/alerts/process-alerts");
  const result = await processAlerts();
  return { data: { created: result.created, updated: result.updated, skipped: result.skipped } };
}

export async function sendWhatsAppAlertFromEdge(
  profileId: string
): Promise<ActionResult<{ success: boolean; sent?: boolean; messageId?: string; error?: string }>> {
  await requireAuth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Supabase no está configurado para invocar Edge Functions." };
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-whatsapp-alert`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ profileId }),
    });

    const result = (await response.json()) as {
      success: boolean;
      sent?: boolean;
      messageId?: string;
      error?: string;
    };

    if (!response.ok || !result.success) {
      return { error: result.error || `Edge Function HTTP ${response.status}` };
    }

    return { data: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al invocar la Edge Function." };
  }
}
