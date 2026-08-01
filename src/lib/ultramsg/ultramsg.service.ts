import type { UltraMsgApiResponse, UltraMsgConfig, UltraMsgSendResult } from "./types";

const DEFAULT_BASE_URL = "https://api.ultramsg.com";

export class UltraMsgService {
  private readonly instanceId: string;
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(config?: Partial<UltraMsgConfig>) {
    const instanceId = config?.instanceId ?? process.env.ULTRAMSG_INSTANCE_ID;
    const token = config?.token ?? process.env.ULTRAMSG_TOKEN;
    const baseUrl = config?.baseUrl ?? process.env.ULTRAMSG_BASE_URL ?? DEFAULT_BASE_URL;

    if (!instanceId || typeof instanceId !== "string" || instanceId.trim() === "") {
      throw new Error("ULTRAMSG_INSTANCE_ID no está configurado.");
    }

    if (!token || typeof token !== "string" || token.trim() === "") {
      throw new Error("ULTRAMSG_TOKEN no está configurado.");
    }

    this.instanceId = instanceId.trim();
    this.token = token.trim();
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async sendMessage(phone: string, message: string): Promise<UltraMsgSendResult> {
    const to = this.normalizePhone(phone);
    const body = message.trim();

    if (!to) {
      throw new Error("El número telefónico es requerido.");
    }

    if (!body) {
      throw new Error("El mensaje es requerido.");
    }

    const url = `${this.baseUrl}/${encodeURIComponent(this.instanceId)}/messages/chat`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: this.token,
          to,
          body,
        }),
      });
    } catch (err) {
      return {
        success: false,
        sent: false,
        error: err instanceof Error ? err.message : "Error de red al contactar UltraMsg.",
      };
    }

    let data: UltraMsgApiResponse | null = null;
    try {
      data = (await response.json()) as UltraMsgApiResponse;
    } catch {
      // Si no es JSON válido, continuamos usando el estado HTTP.
    }

    if (!response.ok) {
      return {
        success: false,
        sent: false,
        error: `UltraMsg HTTP ${response.status}: ${this.extractError(data) || "Error desconocido"}`,
      };
    }

    if (data && typeof data.sent === "boolean" && !data.sent) {
      return {
        success: false,
        sent: false,
        error: this.extractError(data) || "UltraMsg rechazó el mensaje.",
      };
    }

    return {
      success: true,
      sent: true,
      messageId: data?.id ? String(data.id) : undefined,
      response: data ?? undefined,
    };
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, "").trim();
  }

  private extractError(data: UltraMsgApiResponse | null): string | undefined {
    if (!data) return undefined;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    return undefined;
  }
}
