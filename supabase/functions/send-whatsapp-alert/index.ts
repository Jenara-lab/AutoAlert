import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.8";
import { NotificationService } from "../_shared/notifications.ts";
import { UltraMsgService } from "../_shared/ultramsg.ts";
import type { NotificationContext, NotificationKind } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  profileId?: string;
  kind?: NotificationKind;
  context?: NotificationContext;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método no permitido." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const instanceId = Deno.env.get("ULTRAMSG_INSTANCE_ID");
  const token = Deno.env.get("ULTRAMSG_TOKEN");
  const baseUrl = Deno.env.get("ULTRAMSG_BASE_URL") || undefined;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Configuración de Supabase incompleta." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Cuerpo de la petición inválido." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { profileId, kind, context, message } = body;
  if (!profileId) {
    return new Response(
      JSON.stringify({ success: false, error: "profileId es requerido." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, whatsapp_alerts_enabled")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Perfil no encontrado.",
        details: profileError?.message,
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!profile.whatsapp_alerts_enabled) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "WhatsApp no está habilitado para este perfil.",
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!profile.phone || typeof profile.phone !== "string" || profile.phone.trim() === "") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "El perfil no tiene un número telefónico configurado.",
      }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!isValidPhone(profile.phone)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Número telefónico inválido.",
      }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let ultraMsgService: UltraMsgService;
  let notificationService: NotificationService;
  try {
    ultraMsgService = new UltraMsgService({
      instanceId: instanceId ?? "",
      token: token ?? "",
      baseUrl,
    });
    notificationService = new NotificationService(ultraMsgService);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error de configuración de UltraMsg.";
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let result;
  try {
    if (message && typeof message === "string" && message.trim() !== "") {
      result = await ultraMsgService.sendMessage(profile.phone, message);
    } else if (kind && context) {
      switch (kind) {
        case "maintenance":
          result = await notificationService.sendMaintenanceReminder(profile.phone, context);
          break;
        case "insurance":
          result = await notificationService.sendInsuranceReminder(profile.phone, context);
          break;
        case "registration":
          result = await notificationService.sendRegistrationReminder(profile.phone, context);
          break;
        case "mileage":
          result = await notificationService.sendMileageReminder(profile.phone, context);
          break;
        default: {
          const _exhaustive: never = kind;
          throw new Error(`Tipo de recordatorio no soportado: ${_exhaustive}`);
        }
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Debe proporcionar message o kind + context.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Error inesperado al enviar el mensaje.";
    console.error("[send-whatsapp-alert] send error:", err);
    return new Response(
      JSON.stringify({ success: false, error: `Error al enviar mensaje: ${errMsg}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    await supabase.from("alert_deliveries").insert({
      profile_id: profile.id,
      channel: "whatsapp",
      status: result.success ? "sent" : "failed",
      error_message: result.error || null,
      external_message_id: result.messageId || null,
      payload: {
        phone: profile.phone,
        kind: kind || null,
        context: context || null,
        message: message || null,
      },
    });
  } catch (logErr) {
    console.error("[send-whatsapp-alert] alert_deliveries insert error:", logErr);
  }

  const statusCode = result.success ? 200 : 502;
  return new Response(
    JSON.stringify({
      success: result.success,
      sent: result.sent,
      messageId: result.messageId,
      error: result.error,
    }),
    { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}
