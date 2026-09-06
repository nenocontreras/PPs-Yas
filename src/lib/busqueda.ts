import type { Enums } from "@/lib/database.types";

export type Fuente = Enums<"documento_fuente">;

export type DocIndexable = {
  fuente: Fuente;
  fuente_id: string;
  titulo: string;
  contenido: string;
};

export type Resultado = {
  id: string;
  fuente: Fuente;
  fuente_id: string;
  titulo: string;
  contenido: string;
  similitud: number;
};

export const FUENTE_LABEL: Record<Fuente, string> = {
  entrevista: "Entrevista",
  jornada: "Jornada",
  evidencia: "Evidencia",
};

/** Los módulos jornada/evidencia no tienen página de detalle: linkean al listado. */
export function hrefFuente(fuente: Fuente, fuenteId: string): string {
  switch (fuente) {
    case "entrevista":
      return `/entrevistas/${fuenteId}`;
    case "jornada":
      return "/bitacora";
    case "evidencia":
      return "/evidencia";
  }
}

/** Recorta el contenido para el fragmento del resultado. */
export function snippet(texto: string, max = 220): string {
  const clean = texto.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
