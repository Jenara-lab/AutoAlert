export type UserRole = "owner" | "mechanic";

export type MaintenanceType =
  | "oil_change"
  | "filter_change"
  | "brake_change"
  | "tire_change"
  | "battery_change"
  | "tune_up"
  | "general_repair";

export type OperatingExpenseType = "fuel" | "insurance" | "registration";

export type AlertKind =
  | "maintenance_date"
  | "maintenance_mileage"
  | "insurance_expiry"
  | "registration_expiry";

export type AlertStatus = "pending" | "read" | "sent" | "failed";

export type AlertChannel = "in_app" | "email" | "whatsapp";

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  currencyCode: string;
  emailAlertsEnabled: boolean;
  whatsappAlertsEnabled: boolean;
  dateLeadDays: number;
  mileageThresholdKm: number;
  createdAt: string;
  updatedAt: string;
};

export type Vehicle = {
  id: string;
  ownerId: string;
  plate: string;
  normalizedPlate: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  currentMileage: number;
  fuelType: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Workshop = {
  id: string;
  mechanicId: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleWorkshop = {
  id: string;
  vehicleId: string;
  workshopId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MileageLog = {
  id: string;
  vehicleId: string;
  recorderId: string;
  mileage: number;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  workshopId: string | null;
  creatorId: string;
  type: MaintenanceType;
  mileage: number;
  serviceDate: string;
  description: string | null;
  costTotal: number | null;
  costLabor: number | null;
  costParts: number | null;
  nextServiceDate: string | null;
  nextServiceMileage: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OperatingExpense = {
  id: string;
  vehicleId: string;
  creatorId: string;
  type: OperatingExpenseType;
  amount: number;
  date: string;
  notes: string | null;
  fuelQuantity: number | null;
  fuelUnit: string | null;
  fuelStation: string | null;
  fuelAddress: string | null;
  dueDate: string | null;
  termMonths: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Alert = {
  id: string;
  recipientId: string;
  vehicleId: string;
  sourceRecordId: string | null;
  sourceType: string | null;
  kind: AlertKind;
  channel: AlertChannel;
  status: AlertStatus;
  title: string;
  message: string;
  dueDate: string | null;
  dueMileage: number | null;
  sentAt: string | null;
  readAt: string | null;
  errorDetail: string | null;
  createdAt: string;
  updatedAt: string;
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: "Cambio de aceite",
  filter_change: "Cambio de filtro",
  brake_change: "Cambio de frenos",
  tire_change: "Cambio de llantas",
  battery_change: "Cambio de batería",
  tune_up: "Afinamiento",
  general_repair: "Reparación general",
};

export const MAINTENANCE_TYPE_ICONS: Record<MaintenanceType, string> = {
  oil_change: "🛢️",
  filter_change: "🔧",
  brake_change: "🛑",
  tire_change: "⚙️",
  battery_change: "🔋",
  tune_up: "🔩",
  general_repair: "🛠️",
};

export const EXPENSE_TYPE_LABELS: Record<OperatingExpenseType, string> = {
  fuel: "Combustible",
  insurance: "Seguro",
  registration: "Revisión vehicular",
};

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  maintenance_date: "Servicio próximo",
  maintenance_mileage: "Kilometraje",
  insurance_expiry: "Seguro por vencer",
  registration_expiry: "Revisión por vencer",
};
