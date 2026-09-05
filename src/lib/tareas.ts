import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";

export type Tarea = Tables<"tareas">;

export async function listTareas(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from("tareas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
