import type { Review, ResponseTone } from "@/types";
import type { GenerateResponseOptions } from "./types";
import { TOPIC_PHRASES } from "./topics";

function pick<T>(items: T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length];
}

function firstName(author: string): string {
  return author.trim().split(" ")[0];
}

function topicPhrase(review: Review): string {
  const [first] = review.topics;
  return first ? TOPIC_PHRASES[first] : "tu visita";
}

/**
 * Deterministic, template-based reply generator standing in for a real LLM
 * call. Never invents specifics the review didn't mention — it only
 * references the review's own rating, topics and author name, and rotates
 * through hand-written phrasings so replies to similar reviews don't read
 * as copy-pasted.
 */
export function generateReviewResponse(review: Review, options: GenerateResponseOptions): string {
  const { tone, variant = 0 } = options;
  const name = firstName(review.author);
  const topic = topicPhrase(review);

  if (review.rating >= 4) {
    return buildPositiveResponse(name, topic, tone, variant);
  }
  if (review.rating === 3) {
    return buildNeutralResponse(name, topic, tone, variant);
  }
  return buildNegativeResponse(name, topic, tone, variant);
}

function buildPositiveResponse(name: string, topic: string, tone: ResponseTone, variant: number): string {
  const cercano = [
    `¡Hola ${name}! Mil gracias por tu reseña, nos alegra muchísimo que disfrutaras de ${topic}. Compartimos tu comentario con todo el equipo, seguro que les hace tanta ilusión como a nosotros. ¡Te esperamos pronto por aquí!`,
    `${name}, gracias de corazón por dedicar un momento a escribirnos. Que destaques ${topic} significa mucho para nosotros. ¡Hasta la próxima visita!`,
    `¡Qué alegría leerte, ${name}! Nos encanta que ${topic} te dejara tan buen sabor de boca. Gracias por confiar en nosotros, ¡nos vemos pronto!`,
  ];
  const profesional = [
    `Estimado/a ${name}, agradecemos sinceramente su valoración. Nos complace saber que ${topic} estuvo a la altura de sus expectativas. Trasladaremos su comentario al equipo. Quedamos a su disposición para una próxima visita.`,
    `Gracias, ${name}, por tomarse el tiempo de compartir su experiencia. Valoramos especialmente sus comentarios sobre ${topic}. Esperamos poder atenderle de nuevo próximamente.`,
    `Apreciamos mucho su reseña, ${name}. Nos alegra que ${topic} cumpliera sus expectativas y esperamos seguir contando con su confianza en el futuro.`,
  ];
  return pick(tone === "cercano" ? cercano : profesional, variant);
}

function buildNeutralResponse(name: string, topic: string, tone: ResponseTone, variant: number): string {
  const cercano = [
    `Hola ${name}, gracias por tu sinceridad. Tomamos nota de tu comentario sobre ${topic}, nos ayuda a mejorar. Nos encantaría que nos dieras otra oportunidad para dejarte mejor impresión.`,
    `${name}, gracias por contarnos tu experiencia. Vemos margen de mejora en ${topic} y lo tendremos en cuenta. Esperamos poder demostrarte una versión mejor la próxima vez.`,
    `Gracias por el comentario, ${name}. Queremos que ${topic} esté siempre a la altura, así que apuntamos tu feedback. ¡Ojalá puedas darnos otra oportunidad!`,
  ];
  const profesional = [
    `Estimado/a ${name}, gracias por su valoración. Hemos registrado su comentario sobre ${topic} para revisarlo internamente. Esperamos tener la oportunidad de ofrecerle una mejor experiencia próximamente.`,
    `Agradecemos su comentario, ${name}. Su observación sobre ${topic} será tenida en cuenta por el equipo. Quedamos a su disposición para cualquier consulta adicional.`,
    `Gracias por su tiempo, ${name}. Tomamos nota de lo relacionado con ${topic} para seguir mejorando. Esperamos poder atenderle de nuevo.`,
  ];
  return pick(tone === "cercano" ? cercano : profesional, variant);
}

function buildNegativeResponse(name: string, topic: string, tone: ResponseTone, variant: number): string {
  const cercano = [
    `Hola ${name}, sentimos mucho lo ocurrido con ${topic}, no es la experiencia que queremos para nadie que nos visita. Nos lo tomamos muy en serio y ya lo estamos revisando con el equipo. Nos encantaría poder hablar contigo directamente para arreglarlo.`,
    `${name}, lamentamos de verdad que ${topic} no estuviera a la altura. Gracias por decírnoslo, nos ayuda a corregirlo. Nos gustaría compensarte en una próxima visita si nos das la oportunidad.`,
    `Sentimos mucho leer esto, ${name}. Lo relacionado con ${topic} no representa lo que queremos ofrecer y ya estamos hablando con el equipo para que no se repita. Gracias por tu paciencia.`,
  ];
  const profesional = [
    `Estimado/a ${name}, lamentamos sinceramente lo sucedido en relación con ${topic}. No es el estándar que buscamos ofrecer y estamos revisando internamente lo ocurrido. Le agradeceríamos poder contactar con usted directamente para resolverlo.`,
    `Gracias por hacernos llegar su experiencia, ${name}. Nos disculpamos por lo relativo a ${topic} y estamos tomando medidas para evitar que se repita. Quedamos a su disposición para atenderle personalmente.`,
    `Lamentamos el inconveniente, ${name}. Su comentario sobre ${topic} ha sido trasladado a dirección para su revisión. Le pedimos disculpas y esperamos tener la oportunidad de ofrecerle una mejor experiencia.`,
  ];
  return pick(tone === "cercano" ? cercano : profesional, variant);
}
