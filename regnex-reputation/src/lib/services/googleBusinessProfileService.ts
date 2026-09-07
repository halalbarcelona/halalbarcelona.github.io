import type { GoogleConnectionState, Review } from "@/types";

/**
 * Integration point for Google Business Profile.
 *
 * NONE OF THIS IS WIRED UP YET. The product currently runs entirely on the
 * demo data layer (`src/data/demoReviews.ts`). This file exists so the rest
 * of the app can be written against a stable interface, and so wiring up the
 * real integration later is a matter of implementing these functions rather
 * than reshaping the UI.
 *
 * Architecture for the real integration (not implemented here):
 * - OAuth 2.0 with Google happens server-side. The client ID/secret and the
 *   resulting access/refresh tokens must never reach the browser bundle —
 *   they belong in a backend service (e.g. a small API route or serverless
 *   function) that this file would call over HTTPS.
 * - This frontend module would only ever talk to *our own* backend
 *   (e.g. `POST /api/google-business/connect`, `GET /api/google-business/reviews`),
 *   which in turn talks to Google using the stored credentials.
 * - Incoming reviews would arrive either by polling (Google does not offer a
 *   push webhook for reviews) or via a scheduled backend job that syncs into
 *   our own review store, which the UI already reads from.
 * - Publishing a reply only ever happens after explicit owner approval in
 *   the UI (see Configuración → Preferencias de respuestas). The backend
 *   would call the Business Profile API's reply endpoint and only then mark
 *   the review as "respondida" — the UI must never optimistically claim a
 *   reply was published before that confirmation comes back.
 */

export interface GoogleBusinessProfileService {
  getConnectionState(): GoogleConnectionState;
  /** Starts the OAuth flow. Not implemented in demo mode. */
  connect(): Promise<never>;
  disconnect(): Promise<void>;
  /** Would fetch new/updated reviews from Google via our backend. */
  fetchReviews(): Promise<Review[]>;
  /** Would publish an owner-approved reply via our backend. */
  publishReply(reviewId: string, replyText: string): Promise<never>;
}

class DemoGoogleBusinessProfileService implements GoogleBusinessProfileService {
  private state: GoogleConnectionState = { status: "demo" };

  getConnectionState(): GoogleConnectionState {
    return this.state;
  }

  async connect(): Promise<never> {
    throw new Error(
      "La conexión con Google Business Profile todavía no está disponible. " +
        "Esta acción requiere una integración de backend (OAuth 2.0) que aún no está desplegada."
    );
  }

  async disconnect(): Promise<void> {
    this.state = { status: "demo" };
  }

  async fetchReviews(): Promise<Review[]> {
    throw new Error("fetchReviews() requiere una conexión activa con Google Business Profile.");
  }

  async publishReply(): Promise<never> {
    throw new Error(
      "No se puede publicar en Google en modo demostración. Conecta Google Business Profile para habilitar la publicación real."
    );
  }
}

export const googleBusinessProfileService: GoogleBusinessProfileService =
  new DemoGoogleBusinessProfileService();
