import type {
  GoogleConnectionState,
  ResponsePreferences,
  RestaurantProfile,
} from "@/types";

export const restaurantProfile: RestaurantProfile = {
  name: "Rincón de Cornellà",
  address: "Carrer de Sant Ildefons, 24, 08940 Cornellà de Llobregat, Barcelona",
  phone: "+34 93 377 45 12",
  email: "hola@rincondecornella.es",
  city: "Cornellà de Llobregat",
};

export const defaultResponsePreferences: ResponsePreferences = {
  tone: "cercano",
  autoResponsesEnabled: false,
  manualReviewRequired: true,
  alertOnLowRating: true,
};

export const defaultGoogleConnectionState: GoogleConnectionState = {
  status: "demo",
};
