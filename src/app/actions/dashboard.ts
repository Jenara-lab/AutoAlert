"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";

export type DashboardData = {
  vehicleCount: number;
  upcomingServiceCount: number;
  monthlyExpenseTotal: number;
  pendingAlertCount: number;
  upcomingServices: Array<{
    vehicleId: string;
    vehiclePlate: string;
    vehicleMake: string;
    vehicleModel: string;
    nextServiceDate: string;
    nextServiceMileage: number | null;
    currentMileage: number;
  }>;
  urgentAlerts: Array<{
    id: string;
    title: string;
    message: string;
    kind: string;
    vehiclePlate: string;
    dueDate: string | null;
  }>;
};

export async function getDashboardData(): Promise<
  { data: DashboardData } | { error: string }
> {
  const user = await requireAuth();
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [
    vehiclesResult,
    maintenanceResult,
    expensesResult,
    alertsResult,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id")
      .is("deleted_at", null)
      .eq("owner_id", user.id),

    supabase
      .from("maintenance_records")
      .select(
        "id, vehicle_id, next_service_date, next_service_mileage, vehicles!inner(plate, make, model, current_mileage)"
      )
      .is("deleted_at", null)
      .not("next_service_date", "is", null)
      .gte("next_service_date", today),

    supabase
      .from("operating_expenses")
      .select("amount")
      .is("deleted_at", null)
      .gte("date", monthStart)
      .lte("date", monthEnd),

    supabase
      .from("alerts")
      .select(
        "id, title, message, kind, due_date, vehicles!inner(plate)"
      )
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .or(`due_date.is.null,due_date.gte.${today}`)
      .order("due_date", { ascending: true })
      .limit(10),
  ]);

  const upcomingServices = (maintenanceResult.data ?? []).map((r) => {
    const v = r.vehicles as unknown as {
      plate: string;
      make: string;
      model: string;
      current_mileage: number;
    };
    return {
      vehicleId: r.vehicle_id,
      vehiclePlate: v.plate,
      vehicleMake: v.make,
      vehicleModel: v.model,
      nextServiceDate: r.next_service_date!,
      nextServiceMileage: r.next_service_mileage,
      currentMileage: v.current_mileage,
    };
  });

  const urgentAlerts = (alertsResult.data ?? []).map((a) => {
    const v = a.vehicles as unknown as { plate: string };
    return {
      id: a.id,
      title: a.title,
      message: a.message,
      kind: a.kind,
      vehiclePlate: v.plate,
      dueDate: a.due_date,
    };
  });

  return {
    data: {
      vehicleCount: vehiclesResult.data?.length ?? 0,
      upcomingServiceCount: upcomingServices.length,
      monthlyExpenseTotal: (expensesResult.data ?? []).reduce(
        (sum, r) => sum + Number(r.amount),
        0
      ),
      pendingAlertCount: alertsResult.data?.length ?? 0,
      upcomingServices,
      urgentAlerts,
    },
  };
}
