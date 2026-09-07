export type Rating = 1 | 2 | 3 | 4 | 5;

export type Sentiment = "positivo" | "neutral" | "negativo";

export type Priority = "urgente" | "atencion" | "normal";

export type ResponseStatus =
  | "sin_responder"
  | "borrador_generado"
  | "respondida"
  | "requiere_revision";

export type ReviewTopic =
  | "comida"
  | "servicio"
  | "tiempo_espera"
  | "ambiente"
  | "precio"
  | "personal"
  | "reservas"
  | "terraza"
  | "platos"
  | "ubicacion";

export interface Review {
  id: string;
  author: string;
  rating: Rating;
  /** ISO 8601 timestamp */
  date: string;
  text: string;
  sentiment: Sentiment;
  priority: Priority;
  topics: ReviewTopic[];
  responseStatus: ResponseStatus;
  /** Why this review was flagged, for the Alertas page */
  flagReason?: string;
  suggestedAction: string;
  aiResponseDraft?: string;
  approvedResponse?: string;
  respondedAt?: string;
  source: "google";
}
