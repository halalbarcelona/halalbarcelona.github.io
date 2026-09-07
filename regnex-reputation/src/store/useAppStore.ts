import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResponseStatus, ResponsePreferences, RestaurantProfile, Review } from "@/types";
import { demoReviews } from "@/data/demoReviews";
import { demoNotifications } from "@/data/demoNotifications";
import { restaurantProfile as defaultProfile, defaultResponsePreferences } from "@/data/restaurant";
import type { AppNotification } from "@/types";

interface AppState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  reviews: Review[];
  setReviewDraft: (id: string, draft: string) => void;
  approveReviewResponse: (id: string, text: string) => void;
  markReviewRequiresRevision: (id: string) => void;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  restaurantProfile: RestaurantProfile;
  updateRestaurantProfile: (patch: Partial<RestaurantProfile>) => void;

  responsePreferences: ResponsePreferences;
  updateResponsePreferences: (patch: Partial<ResponsePreferences>) => void;
}

function nextStatusAfterDraft(current: ResponseStatus): ResponseStatus {
  return current === "respondida" ? current : "borrador_generado";
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),

      reviews: demoReviews,
      setReviewDraft: (id, draft) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, aiResponseDraft: draft, responseStatus: nextStatusAfterDraft(r.responseStatus) } : r
          ),
        })),
      approveReviewResponse: (id, text) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id
              ? {
                  ...r,
                  approvedResponse: text,
                  responseStatus: "respondida",
                  respondedAt: new Date().toISOString(),
                }
              : r
          ),
        })),
      markReviewRequiresRevision: (id) =>
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === id ? { ...r, responseStatus: "requiere_revision" } : r)),
        })),

      notifications: demoNotifications,
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      restaurantProfile: defaultProfile,
      updateRestaurantProfile: (patch) =>
        set((state) => ({ restaurantProfile: { ...state.restaurantProfile, ...patch } })),

      responsePreferences: defaultResponsePreferences,
      updateResponsePreferences: (patch) =>
        set((state) => ({ responsePreferences: { ...state.responsePreferences, ...patch } })),
    }),
    {
      name: "regnex-reputation-store",
      version: 1,
    }
  )
);
