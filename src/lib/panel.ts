import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums } from "@/lib/database.types";
import type { Evento } from "@/lib/calendario";

export type PanelData = {
  totalHoras: number;
  jornadasCount: number;
  tareas: Record<Enums<"tarea_estado">, number>;
  proximosEventos: Evento[];
  entrevistasCount: number;
};

/** Fecha de hoy en horario de Argentina (el server corre en UTC). */
function hoyAR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

/**
 * Datos del panel de progreso, calculados sobre las tablas existentes
 * (bitácora / tareas / calendario). Entrevistas queda en 0 hasta la Fase 6.
 */
export async function getPanelData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PanelData> {
  const [jornadasRes, tareasRes, eventosRes] = await Promise.all([
    supabase.from("jornadas").select("horas").eq("user_id", userId),
    supabase.from("tareas").select("estado").eq("user_id", userId),
    supabase
      .from("eventos")
      .select("*")
      .eq("user_id", userId)
      .gte("fecha", hoyAR())
      .order("fecha", { ascending: true })
      .limit(5),
  ]);

  if (jornadasRes.error) throw new Error(jornadasRes.error.message);
  if (tareasRes.error) throw new Error(tareasRes.error.message);
  if (eventosRes.error) throw new Error(eventosRes.error.message);

  const jornadas = jornadasRes.data ?? [];
  const tareas: PanelData["tareas"] = {
    pendiente: 0,
    en_curso: 0,
    completada: 0,
  };
  for (const t of tareasRes.data ?? []) tareas[t.estado]++;

  return {
    totalHoras: jornadas.reduce((sum, j) => sum + Number(j.horas), 0),
    jornadasCount: jornadas.length,
    tareas,
    proximosEventos: eventosRes.data ?? [],
    entrevistasCount: 0,
  };
}
