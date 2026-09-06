import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums } from "@/lib/database.types";
import type { Evento } from "@/lib/calendario";
import { parseISODate } from "@/lib/dates";
import { HORAS_MINIMO } from "@/lib/pps";

export type Ritmo = {
  /** Primera jornada registrada (ISO "YYYY-MM-DD"). */
  desde: string;
  /** Promedio de horas por semana desde la primera jornada. */
  horasSemana: number;
  /**
   * Fecha estimada (ISO) para alcanzar el mínimo reglamentario a este ritmo.
   * `null` si el mínimo ya está cumplido o no hay ritmo para proyectar.
   */
  fechaEstimadaMinimo: string | null;
};

export type PanelData = {
  totalHoras: number;
  jornadasCount: number;
  tareas: Record<Enums<"tarea_estado">, number>;
  proximosEventos: Evento[];
  entrevistasCount: number;
  /** Ritmo y proyección; `null` cuando todavía no hay jornadas. */
  ritmo: Ritmo | null;
};

/** Fecha de hoy en horario de Argentina (el server corre en UTC). */
function hoyAR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

/** Días enteros entre dos fechas ISO "YYYY-MM-DD" (hasta − desde). */
function diffDias(desdeISO: string, hastaISO: string): number {
  const ms = parseISODate(hastaISO).getTime() - parseISODate(desdeISO).getTime();
  return Math.round(ms / 86_400_000);
}

/** Suma días a una fecha ISO y devuelve otra fecha ISO. */
function sumarDias(iso: string, dias: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + Math.ceil(dias));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calcularRitmo(
  fechas: string[],
  totalHoras: number,
  hoy: string,
): Ritmo | null {
  if (fechas.length === 0) return null;

  const desde = fechas.reduce((min, f) => (f < min ? f : min), fechas[0]);
  // Piso de 1 semana para no inflar el ritmo con pocos días de historia.
  const dias = Math.max(diffDias(desde, hoy), 7);
  const horasSemana = (totalHoras / dias) * 7;

  let fechaEstimadaMinimo: string | null = null;
  if (totalHoras < HORAS_MINIMO && horasSemana > 0) {
    const semanasRestantes = (HORAS_MINIMO - totalHoras) / horasSemana;
    fechaEstimadaMinimo = sumarDias(hoy, semanasRestantes * 7);
  }

  return { desde, horasSemana, fechaEstimadaMinimo };
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
    supabase.from("jornadas").select("horas, fecha").eq("user_id", userId),
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

  const totalHoras = jornadas.reduce((sum, j) => sum + Number(j.horas), 0);

  return {
    totalHoras,
    jornadasCount: jornadas.length,
    tareas,
    proximosEventos: eventosRes.data ?? [],
    entrevistasCount: 0,
    ritmo: calcularRitmo(
      jornadas.map((j) => j.fecha),
      totalHoras,
      hoyAR(),
    ),
  };
}
