export interface UltraMsgConfig {
  instanceId: string;
  token: string;
  baseUrl?: string;
}

export interface UltraMsgSendResult {
  success: boolean;
  sent: boolean;
  messageId?: string;
  response?: unknown;
  error?: string;
}

export interface UltraMsgApiResponse {
  sent?: boolean;
  message?: string;
  id?: string | number;
  [key: string]: unknown;
}
