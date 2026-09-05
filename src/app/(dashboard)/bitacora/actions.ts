"use server";

import { revalidatePath } from "next/cache";

import { fieldError, optionalStr, str, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/supabase/require-user";

const ROUTE = "/bitacora";

function parseJornada(formData: FormData) {
  const errors: Record<string, string> = {};

  const fecha = str(formData.get("fecha"));
  if (!fecha) errors.fecha = "Elegí la fecha de la jornada.";
  else if (fecha > new Date().toISOString().slice(0, 10))
    errors.fecha = "La fecha no puede ser futura.";

  const horasRaw = str(formData.get("horas")).replace(",", ".");
  const horas = Number(horasRaw);
  if (!horasRaw) errors.horas = "Ingresá las horas.";
  else if (!Number.isFinite(horas) || horas <= 0 || horas > 24)
    errors.horas = "Entre 0 y 24 horas.";

  const tareas_realizadas = str(formData.get("tareas_realizadas"));
  if (!tareas_realizadas)
    errors.tareas_realizadas = "Contá qué hiciste en la jornada.";

  return {
    errors,
    values: {
      fecha,
      horas: Math.round(horas * 10) / 10,
      tareas_realizadas,
      observaciones: optionalStr(formData.get("observaciones")),
    },
  };
}

export async function createJornada(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseJornada(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("jornadas")
    .insert({ user_id: user.id, ...values });
  if (error) return { error: "No se pudo guardar la jornada." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function updateJornada(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseJornada(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("jornadas")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function deleteJornada(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("jornadas").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(ROUTE);
}
