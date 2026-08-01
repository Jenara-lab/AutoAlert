"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import {
  createExpenseSchema,
  type CreateExpenseValues,
} from "@/lib/validations/expenses";
import { syncExpenseAlert } from "@/lib/alerts/sync";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getOperatingExpenses(filters?: {
  vehicleId?: string;
  type?: string;
  from?: string;
  to?: string;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      vehicleId: string;
      type: string;
      amount: number;
      date: string;
      notes: string | null;
      fuelQuantity: number | null;
      fuelUnit: string | null;
      fuelStation: string | null;
      fuelAddress: string | null;
      dueDate: string | null;
      termMonths: number | null;
      vehiclePlate: string;
      vehicleMake: string;
      vehicleModel: string;
    }>
  >
> {
  await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("operating_expenses")
    .select(
      "id, vehicle_id, type, amount, date, notes, fuel_quantity, fuel_unit, fuel_station, fuel_address, due_date, term_months, vehicles!inner(plate, make, model)",
    )
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (filters?.vehicleId) query = query.eq("vehicle_id", filters.vehicleId);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.from) query = query.gte("date", filters.from);
  if (filters?.to) query = query.lte("date", filters.to);

  const { data, error } = await query;

  if (error) return { error: "No se pudieron cargar los gastos." };

  return {
    data: data.map((r) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      type: r.type,
      amount: Number(r.amount),
      date: r.date,
      notes: r.notes,
      fuelQuantity: r.fuel_quantity != null ? Number(r.fuel_quantity) : null,
      fuelUnit: r.fuel_unit,
      fuelStation: r.fuel_station,
      fuelAddress: r.fuel_address,
      dueDate: r.due_date,
      termMonths: r.term_months,
      vehiclePlate: (r.vehicles as unknown as { plate: string }).plate,
      vehicleMake: (r.vehicles as unknown as { make: string }).make,
      vehicleModel: (r.vehicles as unknown as { model: string }).model,
    })),
  };
}

export async function getOperatingExpense(
  id: string,
): Promise<ActionResult<Record<string, unknown>>> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operating_expenses")
    .select("*, vehicles(plate, make, model, owner_id)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return { error: "Gasto no encontrado." };
  return { data };
}

export async function createExpense(
  values: CreateExpenseValues,
): Promise<ActionResult<string>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = createExpenseSchema.safeParse(values);
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

  const insertData: Record<string, unknown> = {
    vehicle_id: d.vehicleId,
    creator_id: user.id,
    type: d.type,
    amount: d.amount,
    date: d.date,
    notes: d.notes || null,
  };

  if (d.type === "fuel") {
    insertData.fuel_quantity = d.fuelQuantity ?? null;
    insertData.fuel_unit = d.fuelUnit || null;
    insertData.fuel_station = d.fuelStation || null;
    insertData.fuel_address = d.fuelAddress || null;
  }

  if (d.type === "insurance" || d.type === "registration") {
    insertData.due_date = d.dueDate || null;
    insertData.term_months =
      d.termMonths && [3, 6, 12].includes(d.termMonths) ? d.termMonths : null;
  }

  const { data, error } = await supabase
    .from("operating_expenses")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createExpense] insert error:", error);
    return {
      error: `No se pudo registrar el gasto: ${error.message || error.code || "error desconocido"}`,
    };
  }

  if (data && (d.type === "insurance" || d.type === "registration")) {
    await syncExpenseAlert(supabase, {
      id: data.id,
      vehicle_id: d.vehicleId,
      type: d.type,
      due_date: d.dueDate || null,
    });
  }

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath(`/vehicles/${d.vehicleId}`);
  return { data: data.id };
}

export async function updateExpense(
  id: string,
  values: Partial<CreateExpenseValues>,
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = createExpenseSchema.partial().safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const { data: existing } = await supabase
    .from("operating_expenses")
    .select("id, creator_id, vehicle_id, type")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) return { error: "Gasto no encontrado." };
  if (existing.creator_id !== user.id)
    return { error: "No tienes permiso para editar este gasto." };

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.vehicleId !== undefined) updateData.vehicle_id = d.vehicleId;
  if (d.type !== undefined) updateData.type = d.type;
  if (d.amount !== undefined) updateData.amount = d.amount;
  if (d.date !== undefined) updateData.date = d.date;
  if (d.notes !== undefined) updateData.notes = d.notes || null;

  if (d.type === "fuel" || existing.type === "fuel") {
    if (d.fuelQuantity !== undefined) updateData.fuel_quantity = d.fuelQuantity ?? null;
    if (d.fuelUnit !== undefined) updateData.fuel_unit = d.fuelUnit || null;
    if (d.fuelStation !== undefined) updateData.fuel_station = d.fuelStation || null;
    if (d.fuelAddress !== undefined) updateData.fuel_address = d.fuelAddress || null;
  }

  if (d.type === "insurance" || d.type === "registration" || existing.type === "insurance" || existing.type === "registration") {
    if (d.dueDate !== undefined) updateData.due_date = d.dueDate || null;
    if (d.termMonths !== undefined) {
      updateData.term_months =
        d.termMonths && [3, 6, 12].includes(d.termMonths) ? d.termMonths : null;
    }
  }

  if (Object.keys(updateData).length === 0) return { data: undefined };

  const { error } = await supabase
    .from("operating_expenses")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el gasto." };

  if (
    existing.type === "insurance" ||
    existing.type === "registration" ||
    d.type === "insurance" ||
    d.type === "registration"
  ) {
    const { data: record } = await supabase
      .from("operating_expenses")
      .select("id, vehicle_id, type, due_date")
      .eq("id", id)
      .single();

    if (record) {
      await syncExpenseAlert(supabase, {
        id: record.id,
        vehicle_id: record.vehicle_id,
        type: record.type,
        due_date: record.due_date,
      });
    }
  }

  revalidatePath("/history");
  revalidatePath(`/history/${id}`);
  return { data: undefined };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("operating_expenses")
    .select("id, creator_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!existing) return { error: "Gasto no encontrado." };
  if (existing.creator_id !== user.id)
    return { error: "No tienes permiso para eliminar este gasto." };

  const { error } = await supabase
    .from("operating_expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "No se pudo eliminar el gasto." };

  revalidatePath("/history");
  return { data: undefined };
}

export type HistoryCategory = "maintenance" | "fuel" | "insurance" | "registration" | "mileage";

export type HistoryItem = {
  id: string;
  category: HistoryCategory;
  date: string;
  title: string;
  subtitle: string;
  amount: number | null;
  vehicleId: string;
  vehiclePlate: string;
};

export async function getHistoryItems(filters?: {
  vehicleId?: string;
  type?: string;
  category?: HistoryCategory;
  workshopId?: string;
  from?: string;
  to?: string;
}): Promise<{ data: HistoryItem[]; total: number } | { error: string }> {
  await requireAuth();
  const supabase = await createClient();

  const from = filters?.from;
  const to = filters?.to;
  const defaultFrom = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const defaultTo = to ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0];

  const cat = filters?.category;
  const includeMaintenance = !cat || cat === "maintenance";
  const includeMileage = !cat || cat === "mileage";
  const expenseTypes = ["fuel", "insurance", "registration"] as const;
  const includeExpenses =
    !cat || expenseTypes.includes(cat as (typeof expenseTypes)[number]);
  const expenseTypeFilter =
    cat && expenseTypes.includes(cat as (typeof expenseTypes)[number])
      ? cat
      : filters?.type && expenseTypes.includes(filters.type as (typeof expenseTypes)[number])
        ? filters.type
        : undefined;
  const maintenanceTypeFilter =
    cat === "maintenance" || !cat
      ? filters?.type &&
        !expenseTypes.includes(filters.type as (typeof expenseTypes)[number])
        ? filters.type
        : undefined
      : undefined;

  const [maintenanceResult, expensesResult, mileageResult] = await Promise.all([
    includeMaintenance
      ? (async () => {
          let q = supabase
            .from("maintenance_records")
            .select("id, vehicle_id, type, service_date, cost_total, vehicles!inner(plate, make, model)")
            .is("deleted_at", null)
            .gte("service_date", defaultFrom)
            .lte("service_date", defaultTo)
            .order("service_date", { ascending: false });
          if (filters?.vehicleId) q = q.eq("vehicle_id", filters.vehicleId);
          if (maintenanceTypeFilter) q = q.eq("type", maintenanceTypeFilter);
          if (filters?.workshopId) q = q.eq("workshop_id", filters.workshopId);
          return q;
        })()
      : Promise.resolve({ data: null }),
    includeExpenses
      ? (async () => {
          let q = supabase
            .from("operating_expenses")
            .select("id, vehicle_id, type, amount, date, vehicles!inner(plate, make, model)")
            .is("deleted_at", null)
            .gte("date", defaultFrom)
            .lte("date", defaultTo)
            .order("date", { ascending: false });
          if (filters?.vehicleId) q = q.eq("vehicle_id", filters.vehicleId);
          if (expenseTypeFilter) q = q.eq("type", expenseTypeFilter);
          return q;
        })()
      : Promise.resolve({ data: null }),
    includeMileage
      ? (async () => {
          let q = supabase
            .from("mileage_logs")
            .select("id, vehicle_id, mileage, date, vehicles!inner(plate, make, model)")
            .gte("date", defaultFrom)
            .lte("date", defaultTo)
            .order("date", { ascending: false });
          if (filters?.vehicleId) q = q.eq("vehicle_id", filters.vehicleId);
          return q;
        })()
      : Promise.resolve({ data: null }),
  ]);

  const items: HistoryItem[] = [];

  const TYPE_LABELS: Record<string, string> = {
    oil_change: "Cambio de aceite",
    filter_change: "Cambio de filtro",
    brake_change: "Cambio de frenos",
    tire_change: "Cambio de llantas",
    battery_change: "Cambio de batería",
    tune_up: "Afinamiento",
    general_repair: "Reparación general",
  };

  if (maintenanceResult.data) {
    for (const r of maintenanceResult.data) {
      const v = r.vehicles as unknown as { plate: string; make: string; model: string };
      items.push({
        id: r.id,
        category: "maintenance",
        date: r.service_date,
        title: TYPE_LABELS[r.type] ?? r.type,
        subtitle: `${v.make} ${v.model} · ${v.plate}`,
        amount: r.cost_total != null ? Number(r.cost_total) : null,
        vehicleId: r.vehicle_id,
        vehiclePlate: v.plate,
      });
    }
  }

  if (expensesResult.data) {
    for (const r of expensesResult.data) {
      const v = r.vehicles as unknown as { plate: string; make: string; model: string };
      const cat = r.type as "fuel" | "insurance" | "registration";
      const labels = { fuel: "Combustible", insurance: "Seguro", registration: "Revisión vehicular" };
      items.push({
        id: r.id,
        category: cat,
        date: r.date,
        title: labels[cat],
        subtitle: `${v.make} ${v.model} · ${v.plate}`,
        amount: Number(r.amount),
        vehicleId: r.vehicle_id,
        vehiclePlate: v.plate,
      });
    }
  }

  if (mileageResult.data) {
    for (const r of mileageResult.data) {
      const v = r.vehicles as unknown as { plate: string; make: string; model: string };
      items.push({
        id: r.id,
        category: "mileage",
        date: r.date,
        title: `Kilometraje: ${r.mileage.toLocaleString("es-HN")} km`,
        subtitle: `${v.make} ${v.model} · ${v.plate}`,
        amount: null,
        vehicleId: r.vehicle_id,
        vehiclePlate: v.plate,
      });
    }
  }

  items.sort((a, b) => b.date.localeCompare(a.date));

  const totalAmount = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return { data: items, total: totalAmount };
}
