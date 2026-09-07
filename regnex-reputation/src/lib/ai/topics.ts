import type { ReviewTopic } from "@/types";

export const TOPIC_LABELS: Record<ReviewTopic, string> = {
  comida: "Comida",
  servicio: "Servicio",
  tiempo_espera: "Tiempo de espera",
  ambiente: "Ambiente",
  precio: "Precio",
  personal: "Personal",
  reservas: "Reservas",
  terraza: "Terraza",
  platos: "Platos",
  ubicacion: "Ubicación",
};

export const TOPIC_PHRASES: Record<ReviewTopic, string> = {
  comida: "la comida",
  servicio: "el servicio",
  tiempo_espera: "el tiempo de espera",
  ambiente: "el ambiente",
  precio: "el precio",
  personal: "la atención del personal",
  reservas: "la gestión de la reserva",
  terraza: "la terraza",
  platos: "los platos",
  ubicacion: "la ubicación",
};

const TOPIC_KEYWORDS: Record<ReviewTopic, string[]> = {
  comida: [
    "comida", "plato", "arroz", "carne", "pescado", "postre", "croqueta",
    "tapas", "paella", "cuscús", "cordero", "bacalao", "pulpo", "canelones",
    "ensaladilla", "calamares", "fideuá", "pan",
  ],
  servicio: ["servicio", "camarero", "camarera", "atendieron", "atendió", "mesero"],
  tiempo_espera: ["espera", "tardar", "tardaron", "tardó", "minutos", "cola", "rato"],
  ambiente: ["ambiente", "ruido", "ruidoso", "música", "decoración", "tranquilo"],
  precio: ["precio", "caro", "cara", "barato", "coste", "euros", "oferta"],
  personal: ["personal", "trato", "amable", "brusco", "grosero", "majo", "encargado"],
  reservas: ["reserva", "reservamos", "reservado", "mesa reservada"],
  terraza: ["terraza"],
  platos: ["plato principal", "entrante", "primer plato", "segundo plato"],
  ubicacion: ["ubicación", "parking", "aparcar", "zona", "cerca", "lejos"],
};

export function extractTopics(text: string): ReviewTopic[] {
  const lower = text.toLowerCase();
  const found = (Object.keys(TOPIC_KEYWORDS) as ReviewTopic[]).filter((topic) =>
    TOPIC_KEYWORDS[topic].some((keyword) => lower.includes(keyword))
  );
  return found.length > 0 ? found : ["comida"];
}
