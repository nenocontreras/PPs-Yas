import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";

export type Entrevista = Tables<"entrevistas">;

export type TemasDetectados = {
  tareas: string[];
  fricciones: string[];
  citas: string[];
};

export function parseTemas(value: unknown): TemasDetectados | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const arr = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : [];
  return {
    tareas: arr(v.tareas),
    fricciones: arr(v.fricciones),
    citas: arr(v.citas),
  };
}

export async function listEntrevistas(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Entrevista[]> {
  const { data, error } = await supabase
    .from("entrevistas")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEntrevista(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
): Promise<Entrevista | null> {
  const { data, error } = await supabase
    .from("entrevistas")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
