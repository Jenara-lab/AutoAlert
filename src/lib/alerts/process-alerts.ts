import { createClient } from "@/lib/supabase/server";

type AlertCandidate = {
  vehicleId: string;
  recipientId: string;
  kind: "maintenance_date" | "maintenance_mileage" | "insurance_expiry" | "registration_expiry";
  title: string;
  message: string;
  dueDate: string | null;
  dueMileage: number | null;
  sourceRecordId: string | null;
  sourceType: string | null;
  serviceType: string | null;
};

const MAINTENANCE_LABELS: Record<string, string> = {
  oil_change: "Cambio de aceite",
  filter_change: "Cambio de filtro",
  brake_change: "Cambio de frenos",
  tire_change: "Cambio de llantas",
  battery_change: "Cambio de batería",
  tune_up: "Afinamiento",
  general_repair: "Reparación general",
};

export async function processAlerts(): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  const supabase = await createClient();
  const candidates: AlertCandidate[] = [];
  const today = new Date().toISOString().split("T")[0];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, date_lead_days, mileage_threshold_km, email_alerts_enabled, whatsapp_alerts_enabled");

  if (!profiles || profiles.length === 0) {
    return { created: 0, updated: 0, skipped: 0 };
  }

  for (const profile of profiles) {
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, current_mileage, plate")
      .eq("owner_id", profile.id)
      .is("deleted_at", null);

    if (!vehicles || vehicles.length === 0) continue;

    for (const vehicle of vehicles) {
      const { data: maintenances } = await supabase
        .from("maintenance_records")
        .select("id, type, next_service_date, next_service_mileage")
        .eq("vehicle_id", vehicle.id)
        .is("deleted_at", null);

      if (maintenances) {
        for (const m of maintenances) {
          const label = MAINTENANCE_LABELS[m.type] ?? m.type;

          if (m.next_service_date && m.next_service_date >= today) {
            candidates.push({
              vehicleId: vehicle.id,
              recipientId: profile.id,
              kind: "maintenance_date",
              title: `Próximo servicio: ${label}`,
              message: `El servicio de ${label} está programado para el ${m.next_service_date}.`,
              dueDate: m.next_service_date,
              dueMileage: null,
              sourceRecordId: m.id,
              sourceType: "maintenance_records",
              serviceType: m.type,
            });
          }

          if (
            m.next_service_mileage != null &&
            m.next_service_mileage >= vehicle.current_mileage
          ) {
            candidates.push({
              vehicleId: vehicle.id,
              recipientId: profile.id,
              kind: "maintenance_mileage",
              title: `Kilometraje: ${label}`,
              message: `El próximo servicio de ${label} está programado a los ${m.next_service_mileage} km.`,
              dueDate: null,
              dueMileage: m.next_service_mileage,
              sourceRecordId: `${m.id}:mileage`,
              sourceType: "maintenance_records",
              serviceType: m.type,
            });
          }
        }
      }

      const { data: insurances } = await supabase
        .from("operating_expenses")
        .select("id, due_date")
        .eq("vehicle_id", vehicle.id)
        .eq("type", "insurance")
        .is("deleted_at", null)
        .not("due_date", "is", null);

      if (insurances) {
        for (const i of insurances) {
          if (!i.due_date || i.due_date < today) continue;
          candidates.push({
            vehicleId: vehicle.id,
            recipientId: profile.id,
            kind: "insurance_expiry",
            title: "Seguro por vencer",
            message: `El seguro vence el ${i.due_date}.`,
            dueDate: i.due_date,
            dueMileage: null,
            sourceRecordId: i.id,
            sourceType: "operating_expenses",
            serviceType: null,
          });
        }
      }

      const { data: registrations } = await supabase
        .from("operating_expenses")
        .select("id, due_date")
        .eq("vehicle_id", vehicle.id)
        .eq("type", "registration")
        .is("deleted_at", null)
        .not("due_date", "is", null);

      if (registrations) {
        for (const r of registrations) {
          if (!r.due_date || r.due_date < today) continue;
          candidates.push({
            vehicleId: vehicle.id,
            recipientId: profile.id,
            kind: "registration_expiry",
            title: "Revisión vehicular por vencer",
            message: `La revisión vehicular vence el ${r.due_date}.`,
            dueDate: r.due_date,
            dueMileage: null,
            sourceRecordId: r.id,
            sourceType: "operating_expenses",
            serviceType: null,
          });
        }
      }
    }
  }

  let created = 0;
  let updated = 0;

  for (const c of candidates) {
    const { data: existing } = await supabase
      .from("alerts")
      .select("id, status, due_date, due_mileage")
      .eq("source_record_id", c.sourceRecordId)
      .eq("recipient_id", c.recipientId)
      .eq("channel", "in_app")
      .maybeSingle();

    if (existing) {
      const needsUpdate =
        existing.due_date !== c.dueDate ||
        existing.due_mileage !== c.dueMileage ||
        existing.status === "dismissed";

      if (needsUpdate) {
        const { error } = await supabase
          .from("alerts")
          .update({
            due_date: c.dueDate,
            due_mileage: c.dueMileage,
            status: "pending",
            title: c.title,
            message: c.message,
            service_type: c.serviceType,
          })
          .eq("id", existing.id);

        if (!error) updated++;
      }
    } else {
      const { error } = await supabase.from("alerts").insert({
        vehicle_id: c.vehicleId,
        recipient_id: c.recipientId,
        kind: c.kind,
        channel: "in_app",
        title: c.title,
        message: c.message,
        due_date: c.dueDate,
        due_mileage: c.dueMileage,
        source_record_id: c.sourceRecordId,
        source_type: c.sourceType,
        service_type: c.serviceType,
        status: "pending",
      });

      if (!error) created++;
    }
  }

  // Dismiss alerts whose source records no longer have a future date/mileage.
  const sourceIds = candidates.map((c) => c.sourceRecordId).filter(Boolean) as string[];
  if (sourceIds.length > 0) {
    await supabase
      .from("alerts")
      .update({ status: "dismissed" })
      .not("source_record_id", "in", sourceIds)
      .eq("channel", "in_app")
      .neq("status", "dismissed");
  }

  return { created, updated, skipped: candidates.length - created - updated };
}

export function isAlertDue(
  alert: {
    kind: string;
    due_date: string | null;
    due_mileage: number | null;
  },
  vehicleCurrentMileage: number,
  leadDays: number,
  mileageThreshold: number,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (alert.due_date) {
    const due = new Date(alert.due_date);
    due.setHours(0, 0, 0, 0);
    if (due < today) return false;
    const lead = new Date(today.getTime() + leadDays * 24 * 60 * 60 * 1000);
    if (due <= lead) return true;
  }

  if (alert.due_mileage != null && alert.kind === "maintenance_mileage") {
    const gap = alert.due_mileage - vehicleCurrentMileage;
    if (gap >= 0 && gap <= mileageThreshold) return true;
  }

  return false;
}
