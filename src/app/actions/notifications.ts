"use server";

import { requireAuth } from "@/lib/permissions/auth";
import type { NotificationContext, NotificationKind } from "@/lib/notifications/notification.service";

export type TestSendStatus =
  | "sent"
  | "error"
  | "invalid_number"
  | "no_phone"
  | "disabled";

export async function sendTestWhatsAppReminder(
  kind: NotificationKind,
  context: NotificationContext,
): Promise<{ status: TestSendStatus; messageId?: string; error?: string }> {
  const user = await requireAuth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !authKey) {
    return {
      status: "error",
      error: "Falta configuración: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas.",
    };
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-whatsapp-alert`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify({
        profileId: user.id,
        kind,
        context,
      }),
    });
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Error al invocar la Edge Function.",
    };
  }

  interface EdgeResult {
    success?: boolean;
    sent?: boolean;
    messageId?: string;
    error?: string;
  }

  let result: EdgeResult | null = null;

  try {
    result = (await response.json()) as EdgeResult;
  } catch {
    // Respuesta no JSON.
  }

  const errorText = result?.error || `Edge Function HTTP ${response.status}`;

  if (!response.ok || result?.success === false) {
    if (errorText.toLowerCase().includes("número telefónico inválido")) {
      return { status: "invalid_number", error: errorText };
    }
    if (errorText.toLowerCase().includes("número telefónico configurado")) {
      return { status: "no_phone", error: errorText };
    }
    if (errorText.toLowerCase().includes("whatsapp no está habilitado")) {
      return { status: "disabled", error: errorText };
    }
    return { status: "error", error: errorText };
  }

  return {
    status: "sent",
    messageId: result?.messageId,
  };
}
