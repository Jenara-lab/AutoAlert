import type { SupabaseClient } from "@supabase/supabase-js";

const MAINTENANCE_LABELS: Record<string, string> = {
  oil_change: "Cambio de aceite",
  filter_change: "Cambio de filtro",
  brake_change: "Cambio de frenos",
  tire_change: "Cambio de llantas",
  battery_change: "Cambio de batería",
  tune_up: "Afinamiento",
  general_repair: "Reparación general",
};

export async function syncMaintenanceAlert(
  supabase: SupabaseClient,
  record: {
    id: string;
    vehicle_id: string;
    type: string;
    next_service_date: string | null;
    next_service_mileage: number | null;
  },
) {
  const hasDate = record.next_service_date != null;
  const hasMileage = record.next_service_mileage != null;

  if (!hasDate && !hasMileage) {
    await supabase
      .from("alerts")
      .update({ status: "dismissed" })
      .eq("source_record_id", record.id)
      .eq("source_type", "maintenance_records");
    return;
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("owner_id")
    .eq("id", record.vehicle_id)
    .single();

  if (!vehicle) return;

  const label = MAINTENANCE_LABELS[record.type] ?? record.type;

  if (hasDate) {
    try {
      await supabase.from("alerts").upsert(
        {
          recipient_id: vehicle.owner_id,
          vehicle_id: record.vehicle_id,
          source_record_id: record.id,
          source_type: "maintenance_records",
          kind: "maintenance_date",
          channel: "in_app",
          title: `Próximo servicio: ${label}`,
          message: `El servicio de ${label} está programado para el ${record.next_service_date}.`,
          due_date: record.next_service_date,
          due_mileage: null,
          service_type: record.type,
          status: "pending",
        },
        { onConflict: "source_record_id,recipient_id,channel" },
      );
    } catch (err) {
      console.error("[syncMaintenanceAlert] date upsert error:", err);
    }
  }

  if (hasMileage) {
    try {
      await supabase.from("alerts").upsert(
        {
          recipient_id: vehicle.owner_id,
          vehicle_id: record.vehicle_id,
          source_record_id: `${record.id}:mileage`,
          source_type: "maintenance_records",
          kind: "maintenance_mileage",
          channel: "in_app",
          title: `Kilometraje: ${label}`,
          message: `El próximo servicio de ${label} está programado a los ${record.next_service_mileage} km.`,
          due_date: null,
          due_mileage: record.next_service_mileage,
          service_type: record.type,
          status: "pending",
        },
        { onConflict: "source_record_id,recipient_id,channel" },
      );
    } catch (err) {
      console.error("[syncMaintenanceAlert] mileage upsert error:", err);
    }
  }
}

export async function syncExpenseAlert(
  supabase: SupabaseClient,
  record: {
    id: string;
    vehicle_id: string;
    type: string;
    due_date: string | null;
  },
) {
  if (record.type !== "insurance" && record.type !== "registration") return;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("owner_id")
    .eq("id", record.vehicle_id)
    .single();

  if (!vehicle) return;

  if (!record.due_date) {
    await supabase
      .from("alerts")
      .update({ status: "dismissed" })
      .eq("source_record_id", record.id)
      .eq("source_type", "operating_expenses");
    return;
  }

  const isInsurance = record.type === "insurance";
  const title = isInsurance ? "Seguro por vencer" : "Revisión vehicular por vencer";
  const message = isInsurance
    ? `El seguro vence el ${record.due_date}.`
    : `La revisión vehicular vence el ${record.due_date}.`;
  const kind = isInsurance ? "insurance_expiry" : "registration_expiry";

  try {
    await supabase.from("alerts").upsert(
      {
        recipient_id: vehicle.owner_id,
        vehicle_id: record.vehicle_id,
        source_record_id: record.id,
        source_type: "operating_expenses",
        kind,
        channel: "in_app",
        title,
        message,
        due_date: record.due_date,
        due_mileage: null,
        service_type: null,
        status: "pending",
      },
      { onConflict: "source_record_id,recipient_id,channel" },
    );
  } catch (err) {
    console.error("[syncExpenseAlert] upsert error:", err);
  }
}
