import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/database.types";

export type Evento = Tables<"eventos">;

export const TIPOS: Enums<"evento_tipo">[] = [
  "jornada",
  "entrega",
  "hito",
  "otro",
];

export const TIPO_LABEL: Record<Enums<"evento_tipo">, string> = {
  jornada: "Jornada",
  entrega: "Entrega",
  hito: "Hito",
  otro: "Otro",
};

/** Color por tipo de evento (se usa para tintar la celda del día y el punto). */
export const TIPO_COLOR: Record<Enums<"evento_tipo">, string> = {
  jornada: "#6366f1", // indigo
  entrega: "#d97706", // ámbar
  hito: "#059669", // esmeralda
  otro: "#64748b", // slate
};

export async function listEventos(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
