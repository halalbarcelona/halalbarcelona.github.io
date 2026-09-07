export * from "./review";

export type NotificationType =
  | "nueva_resena"
  | "resena_negativa"
  | "requiere_atencion"
  | "informe_semanal";

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: import("./review").Priority;
  title: string;
  description: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  read: boolean;
  reviewId?: string;
}

export interface RestaurantProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
}

export type ResponseTone = "profesional" | "cercano";

export interface ResponsePreferences {
  tone: ResponseTone;
  autoResponsesEnabled: boolean;
  manualReviewRequired: boolean;
  alertOnLowRating: boolean;
}

export type GoogleConnectionStatus = "demo" | "connected" | "error";

export interface GoogleConnectionState {
  status: GoogleConnectionStatus;
  connectedAt?: string;
  accountEmail?: string;
}
