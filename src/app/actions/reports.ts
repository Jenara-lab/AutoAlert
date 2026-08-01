"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";

export type ReportData = {
  period: { from: string; to: string };
  expensesByType: Array<{ type: string; label: string; total: number }>;
  expensesByVehicle: Array<{
    vehicleId: string;
    plate: string;
    make: string;
    model: string;
    total: number;
  }>;
  servicesByType: Array<{ type: string; label: string; count: number; totalCost: number }>;
  monthlyTotals: Array<{ month: string; expenses: number; maintenance: number }>;
  upcomingServices: Array<{
    vehicleId: string;
    vehiclePlate: string;
    vehicleMake: string;
    vehicleModel: string;
    currentMileage: number;
    nextServiceDate: string;
    nextServiceMileage: number | null;
    type: string;
    typeLabel: string;
  }>;
  totals: {
    expenses: number;
    maintenance: number;
    grand: number;
  };
};

const TYPE_LABELS: Record<string, string> = {
  oil_change: "Cambio de aceite",
  filter_change: "Cambio de filtro",
  brake_change: "Cambio de frenos",
  tire_change: "Cambio de llantas",
  battery_change: "Cambio de batería",
  tune_up: "Afinamiento",
  general_repair: "Reparación general",
};

const EXPENSE_LABELS: Record<string, string> = {
  fuel: "Combustible",
  insurance: "Seguro",
  registration: "Revisión vehicular",
};

function defaultPeriod(period?: { from?: string; to?: string }) {
  const now = new Date();
  const from =
    period?.from ??
    new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0];
  const to =
    period?.to ??
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { from, to };
}

export async function getReportData(filters?: {
  from?: string;
  to?: string;
  vehicleId?: string;
}): Promise<{ data: ReportData } | { error: string }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const { from, to } = defaultPeriod(filters);

  let expensesQuery = supabase
    .from("operating_expenses")
    .select("id, vehicle_id, type, amount, date, vehicles!inner(plate, make, model, owner_id)")
    .is("deleted_at", null)
    .gte("date", from)
    .lte("date", to);

  let maintenanceQuery = supabase
    .from("maintenance_records")
    .select(
      "id, vehicle_id, type, cost_total, service_date, next_service_date, next_service_mileage, vehicles!inner(plate, make, model, owner_id, current_mileage)",
    )
    .is("deleted_at", null)
    .gte("service_date", from)
    .lte("service_date", to);

  if (filters?.vehicleId) {
    expensesQuery = expensesQuery.eq("vehicle_id", filters.vehicleId);
    maintenanceQuery = maintenanceQuery.eq("vehicle_id", filters.vehicleId);
  }

  if (user.role === "owner") {
    expensesQuery = expensesQuery.eq("vehicles.owner_id", user.id);
    maintenanceQuery = maintenanceQuery.eq("vehicles.owner_id", user.id);
  }

  const [expensesResult, maintenanceResult, upcomingResult] = await Promise.all([
    expensesQuery,
    maintenanceQuery,
    supabase
      .from("maintenance_records")
      .select(
        "id, vehicle_id, type, next_service_date, next_service_mileage, vehicles!inner(id, plate, make, model, owner_id, current_mileage)",
      )
      .is("deleted_at", null)
      .not("next_service_date", "is", null)
      .gte("next_service_date", new Date().toISOString().split("T")[0])
      .order("next_service_date", { ascending: true })
      .limit(20),
  ]);

  const expenses = expensesResult.data ?? [];
  const maintenance = maintenanceResult.data ?? [];

  const expensesByTypeMap = new Map<string, number>();
  for (const e of expenses) {
    expensesByTypeMap.set(e.type, (expensesByTypeMap.get(e.type) ?? 0) + Number(e.amount));
  }
  const expensesByType = Array.from(expensesByTypeMap.entries()).map(([type, total]) => ({
    type,
    label: EXPENSE_LABELS[type] ?? type,
    total,
  }));

  const expensesByVehicleMap = new Map<
    string,
    { plate: string; make: string; model: string; total: number }
  >();
  for (const e of expenses) {
    const v = e.vehicles as unknown as { plate: string; make: string; model: string };
    const existing = expensesByVehicleMap.get(e.vehicle_id);
    if (existing) {
      existing.total += Number(e.amount);
    } else {
      expensesByVehicleMap.set(e.vehicle_id, {
        plate: v.plate,
        make: v.make,
        model: v.model,
        total: Number(e.amount),
      });
    }
  }
  for (const m of maintenance) {
    const v = m.vehicles as unknown as { plate: string; make: string; model: string };
    const cost = m.cost_total != null ? Number(m.cost_total) : 0;
    if (cost <= 0) continue;
    const existing = expensesByVehicleMap.get(m.vehicle_id);
    if (existing) {
      existing.total += cost;
    } else {
      expensesByVehicleMap.set(m.vehicle_id, {
        plate: v.plate,
        make: v.make,
        model: v.model,
        total: cost,
      });
    }
  }
  const expensesByVehicle = Array.from(expensesByVehicleMap.entries())
    .map(([vehicleId, d]) => ({ vehicleId, ...d }))
    .sort((a, b) => b.total - a.total);

  const servicesByTypeMap = new Map<string, { count: number; totalCost: number }>();
  for (const m of maintenance) {
    const existing = servicesByTypeMap.get(m.type);
    const cost = m.cost_total != null ? Number(m.cost_total) : 0;
    if (existing) {
      existing.count++;
      existing.totalCost += cost;
    } else {
      servicesByTypeMap.set(m.type, { count: 1, totalCost: cost });
    }
  }
  const servicesByType = Array.from(servicesByTypeMap.entries()).map(([type, d]) => ({
    type,
    label: TYPE_LABELS[type] ?? type,
    ...d,
  }));

  const monthlyMap = new Map<string, { expenses: number; maintenance: number }>();
  for (const e of expenses) {
    const month = e.date.slice(0, 7);
    const existing = monthlyMap.get(month);
    if (existing) existing.expenses += Number(e.amount);
    else monthlyMap.set(month, { expenses: Number(e.amount), maintenance: 0 });
  }
  for (const m of maintenance) {
    const month = m.service_date.slice(0, 7);
    const cost = m.cost_total != null ? Number(m.cost_total) : 0;
    const existing = monthlyMap.get(month);
    if (existing) existing.maintenance += cost;
    else monthlyMap.set(month, { expenses: 0, maintenance: cost });
  }
  const monthlyTotals = Array.from(monthlyMap.entries())
    .map(([month, d]) => ({ month, ...d }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const upcomingRaw = upcomingResult.data ?? [];
  const upcomingServices = upcomingRaw
    .filter((m) => {
      if (filters?.vehicleId && m.vehicle_id !== filters.vehicleId) return false;
      const v = m.vehicles as unknown as { owner_id: string };
      if (user.role === "owner" && v.owner_id !== user.id) return false;
      return true;
    })
    .map((m) => {
      const v = m.vehicles as unknown as {
        id: string;
        plate: string;
        make: string;
        model: string;
      };
      return {
        vehicleId: m.vehicle_id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        currentMileage: (m.vehicles as unknown as { current_mileage: number }).current_mileage,
        nextServiceDate: m.next_service_date as string,
        nextServiceMileage: m.next_service_mileage,
        type: m.type,
        typeLabel: TYPE_LABELS[m.type] ?? m.type,
      };
    });

  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const maintenanceTotal = maintenance.reduce(
    (s, m) => s + (m.cost_total != null ? Number(m.cost_total) : 0),
    0,
  );

  return {
    data: {
      period: { from, to },
      expensesByType,
      expensesByVehicle,
      servicesByType,
      monthlyTotals,
      upcomingServices,
      totals: {
        expenses: expensesTotal,
        maintenance: maintenanceTotal,
        grand: expensesTotal + maintenanceTotal,
      },
    },
  };
}

export type UpcomingEvent = {
  vehicleId: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  kind: string;
  title: string;
  dueDate: string | null;
  dueMileage: number | null;
  currentMileage: number;
};

export async function getUpcomingEvents(): Promise<
  { data: UpcomingEvent[] } | { error: string }
> {
  const user = await requireAuth();
  const supabase = await createClient();

  let vehiclesQuery = supabase
    .from("vehicles")
    .select("id, plate, make, model, current_mileage")
    .is("deleted_at", null);

  if (user.role === "owner") {
    vehiclesQuery = vehiclesQuery.eq("owner_id", user.id);
  }

  const { data: vehicles, error: vError } = await vehiclesQuery;
  if (vError) return { error: "No se pudieron cargar los vehículos." };
  if (!vehicles || vehicles.length === 0) return { data: [] };

  const vehicleIds = vehicles.map((v) => v.id);
  const today = new Date().toISOString().split("T")[0];

  const [maintenanceResult, expensesResult] = await Promise.all([
    supabase
      .from("maintenance_records")
      .select("vehicle_id, next_service_date, next_service_mileage, type")
      .is("deleted_at", null)
      .in("vehicle_id", vehicleIds)
      .not("next_service_date", "is", null)
      .gte("next_service_date", today),
    supabase
      .from("operating_expenses")
      .select("vehicle_id, type, due_date")
      .is("deleted_at", null)
      .in("vehicle_id", vehicleIds)
      .in("type", ["insurance", "registration"])
      .not("due_date", "is", null)
      .gte("due_date", today),
  ]);

  const vehicleMap = new Map(
    vehicles.map((v) => [
      v.id,
      {
        plate: v.plate,
        make: v.make,
        model: v.model,
        currentMileage: v.current_mileage,
      },
    ]),
  );

  const events: UpcomingEvent[] = [];

  if (maintenanceResult.data) {
    for (const m of maintenanceResult.data) {
      const v = vehicleMap.get(m.vehicle_id);
      if (!v) continue;
      events.push({
        vehicleId: m.vehicle_id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        kind: "maintenance_date",
        title: `Próximo: ${TYPE_LABELS[m.type] ?? m.type}`,
        dueDate: m.next_service_date,
        dueMileage: m.next_service_mileage,
        currentMileage: v.currentMileage,
      });
    }
  }

  if (expensesResult.data) {
    for (const e of expensesResult.data) {
      const v = vehicleMap.get(e.vehicle_id);
      if (!v) continue;
      const label = e.type === "insurance" ? "Seguro" : "Revisión vehicular";
      events.push({
        vehicleId: e.vehicle_id,
        vehiclePlate: v.plate,
        vehicleMake: v.make,
        vehicleModel: v.model,
        kind: e.type === "insurance" ? "insurance_expiry" : "registration_expiry",
        title: `${label} por vencer`,
        dueDate: e.due_date,
        dueMileage: null,
        currentMileage: v.currentMileage,
      });
    }
  }

  events.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return { data: events };
}
