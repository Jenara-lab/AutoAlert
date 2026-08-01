import { UltraMsgService } from "./ultramsg.ts";

export type NotificationKind =
  | "maintenance"
  | "insurance"
  | "registration"
  | "mileage";

export interface VehicleContext {
  make: string;
  model: string;
  plate: string;
}

export interface NotificationContext {
  vehicle: VehicleContext;
  dueDate?: string | null;
  dueMileage?: number | null;
  currentMileage?: number | null;
  serviceType?: string;
  serviceLabel?: string;
}

export interface NotificationResult {
  success: boolean;
  sent: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private readonly ultraMsg: UltraMsgService;

  constructor(ultraMsg?: UltraMsgService) {
    this.ultraMsg = ultraMsg ?? new UltraMsgService();
  }

  buildMessage(kind: NotificationKind, ctx: NotificationContext): string {
    const vehicleName = `${ctx.vehicle.make} ${ctx.vehicle.model}`;
    const plate = ctx.vehicle.plate;

    switch (kind) {
      case "maintenance": {
        const label = ctx.serviceLabel ?? "mantenimiento";
        const date = ctx.dueDate ?? "próximamente";
        return `Hola, te recordamos que el servicio de ${label} para tu vehículo ${vehicleName} (${plate}) está programado para el ${date}. Atentamente, AutoAlert.`;
      }
      case "insurance": {
        const date = ctx.dueDate ?? "próximamente";
        return `Hola, tu seguro del vehículo ${vehicleName} (${plate}) vence el ${date}. Renoválo a tiempo. Atentamente, AutoAlert.`;
      }
      case "registration": {
        const date = ctx.dueDate ?? "próximamente";
        return `Hola, la revisión vehicular de ${vehicleName} (${plate}) vence el ${date}. Tramítala a tiempo. Atentamente, AutoAlert.`;
      }
      case "mileage": {
        const label = ctx.serviceLabel ?? "mantenimiento";
        const due = ctx.dueMileage ?? "programado";
        const current = ctx.currentMileage ?? "actual";
        return `Hola, tu vehículo ${vehicleName} (${plate}) tiene programado un servicio de ${label} a los ${due} km. Llevas ${current} km. Atentamente, AutoAlert.`;
      }
    }
  }

  async sendMaintenanceReminder(
    phone: string,
    ctx: NotificationContext,
  ): Promise<NotificationResult> {
    const message = this.buildMessage("maintenance", ctx);
    return this.ultraMsg.sendMessage(phone, message);
  }

  async sendInsuranceReminder(
    phone: string,
    ctx: NotificationContext,
  ): Promise<NotificationResult> {
    const message = this.buildMessage("insurance", ctx);
    return this.ultraMsg.sendMessage(phone, message);
  }

  async sendMileageReminder(
    phone: string,
    ctx: NotificationContext,
  ): Promise<NotificationResult> {
    const message = this.buildMessage("mileage", ctx);
    return this.ultraMsg.sendMessage(phone, message);
  }

  async sendRegistrationReminder(
    phone: string,
    ctx: NotificationContext,
  ): Promise<NotificationResult> {
    const message = this.buildMessage("registration", ctx);
    return this.ultraMsg.sendMessage(phone, message);
  }
}
