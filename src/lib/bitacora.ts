import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";

export type Jornada = Tables<"jornadas">;

export async function listJornadas(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Jornada[]> {
  const { data, error } = await supabase
    .from("jornadas")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function totalHoras(jornadas: Pick<Jornada, "horas">[]): number {
  return jornadas.reduce((sum, j) => sum + Number(j.horas), 0);
}
