import { NextResponse } from "next/server";
import { processAlerts, isAlertDue } from "@/lib/alerts/process-alerts";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/notifications/notification.service";
import type { NotificationContext, NotificationKind } from "@/lib/notifications/notification.service";

const TYPE_LABELS: Record<string, string> = {
  oil_change: "Cambio de aceite",
  filter_change: "Cambio de filtro",
  brake_change: "Cambio de frenos",
  tire_change: "Cambio de llantas",
  battery_change: "Cambio de batería",
  tune_up: "Afinamiento",
  general_repair: "Reparación general",
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let notificationService: NotificationService | null = null;
  try {
    notificationService = new NotificationService();
  } catch {
    notificationService = null;
  }

  try {
    const result = await processAlerts();

    const supabase = await createClient();

    const { data: pendingAlerts } = await supabase
      .from("alerts")
      .select(
        "id, kind, message, recipient_id, due_date, due_mileage, service_type, vehicle_id, vehicles!inner(make, model, plate, current_mileage), profiles!inner(phone, whatsapp_alerts_enabled, date_lead_days, mileage_threshold_km)"
      )
      .eq("status", "pending")
      .eq("channel", "in_app");

    let sent = 0;
    let failed = 0;

    if (pendingAlerts && notificationService) {
      for (const alert of pendingAlerts) {
        const profile = alert.profiles as unknown as {
          phone: string | null;
          whatsapp_alerts_enabled: boolean;
          date_lead_days: number | null;
          mileage_threshold_km: number | null;
        };
        const vehicle = alert.vehicles as unknown as {
          make: string;
          model: string;
          plate: string;
          current_mileage: number;
        };

        if (!profile.whatsapp_alerts_enabled || !profile.phone) {
          continue;
        }

        const leadDays = profile.date_lead_days ?? 15;
        const mileageThreshold = profile.mileage_threshold_km ?? 300;

        if (!isAlertDue(alert, vehicle.current_mileage, leadDays, mileageThreshold)) {
          continue;
        }

        const context = buildContext(
          alert.kind as AlertKind,
          vehicle,
          alert.due_date,
          alert.due_mileage,
          alert.service_type,
        );

        const kind = mapAlertKindToNotificationKind(alert.kind as AlertKind);
        if (!kind) continue;

        const reminderResult = await sendReminder(notificationService, kind, profile.phone, context);

        if (reminderResult.success) {
          await supabase
            .from("alerts")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", alert.id);

          await supabase.from("alert_deliveries").insert({
            alert_id: alert.id,
            profile_id: alert.recipient_id,
            channel: "whatsapp",
            status: "sent",
            external_message_id: reminderResult.messageId || null,
            payload: { phone: profile.phone, kind, context },
          });

          sent++;
        } else {
          await supabase
            .from("alerts")
            .update({
              status: "failed",
              error_detail: reminderResult.error ?? "Error desconocido",
            })
            .eq("id", alert.id);

          await supabase.from("alert_deliveries").insert({
            alert_id: alert.id,
            profile_id: alert.recipient_id,
            channel: "whatsapp",
            status: "failed",
            error_message: reminderResult.error || null,
            payload: { phone: profile.phone, kind, context },
          });

          failed++;
        }
      }
    }

    return NextResponse.json({
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      sent,
      failed,
      whatsappConfigured: !!notificationService,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

type AlertKind =
  | "maintenance_date"
  | "maintenance_mileage"
  | "insurance_expiry"
  | "registration_expiry";

function mapAlertKindToNotificationKind(kind: AlertKind): NotificationKind | null {
  switch (kind) {
    case "maintenance_date":
      return "maintenance";
    case "maintenance_mileage":
      return "mileage";
    case "insurance_expiry":
      return "insurance";
    case "registration_expiry":
      return "registration";
    default:
      return null;
  }
}

function buildContext(
  kind: AlertKind,
  vehicle: { make: string; model: string; plate: string; current_mileage: number },
  dueDate: string | null,
  dueMileage: number | null,
  serviceType: string | null,
): NotificationContext {
  const base = {
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      plate: vehicle.plate,
    },
  };

  switch (kind) {
    case "maintenance_date":
      return {
        ...base,
        dueDate,
        serviceType: serviceType ?? undefined,
        serviceLabel: serviceType ? TYPE_LABELS[serviceType] ?? serviceType : undefined,
      };
    case "maintenance_mileage":
      return {
        ...base,
        dueMileage,
        currentMileage: vehicle.current_mileage,
        serviceType: serviceType ?? undefined,
        serviceLabel: serviceType ? TYPE_LABELS[serviceType] ?? serviceType : undefined,
      };
    case "insurance_expiry":
      return { ...base, dueDate };
    case "registration_expiry":
      return { ...base, dueDate };
  }
}

async function sendReminder(
  service: NotificationService,
  kind: NotificationKind,
  phone: string,
  context: NotificationContext,
) {
  switch (kind) {
    case "maintenance":
      return service.sendMaintenanceReminder(phone, context);
    case "mileage":
      return service.sendMileageReminder(phone, context);
    case "insurance":
      return service.sendInsuranceReminder(phone, context);
    case "registration":
      return service.sendRegistrationReminder(phone, context);
  }
}
