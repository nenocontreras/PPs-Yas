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
