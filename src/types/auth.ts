export type UserRole = "owner" | "mechanic";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  currency_code: string;
  email_alerts_enabled: boolean;
  whatsapp_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
};
