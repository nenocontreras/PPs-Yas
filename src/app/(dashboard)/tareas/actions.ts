"use server";

import { revalidatePath } from "next/cache";

import type { Enums } from "@/lib/database.types";
import { fieldError, optionalStr, str, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/supabase/require-user";

const ROUTE = "/tareas";
const ESTADOS: Enums<"tarea_estado">[] = [
  "pendiente",
  "en_curso",
  "completada",
];

function parseTarea(formData: FormData) {
  const errors: Record<string, string> = {};

  const titulo = str(formData.get("titulo"));
  if (!titulo) errors.titulo = "Poné un título.";

  const estadoRaw = str(formData.get("estado"));
  const estado = ESTADOS.includes(estadoRaw as Enums<"tarea_estado">)
    ? (estadoRaw as Enums<"tarea_estado">)
    : "pendiente";

  return {
    errors,
    values: {
      titulo,
      descripcion: optionalStr(formData.get("descripcion")),
      estado,
      bloque: optionalStr(formData.get("bloque")),
    },
  };
}

export async function createTarea(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseTarea(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("tareas")
    .insert({ user_id: user.id, ...values });
  if (error) return { error: "No se pudo guardar la tarea." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function updateTarea(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseTarea(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("tareas")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Cambio rápido de estado desde el listado. */
export async function setTareaEstado(
  id: string,
  estado: Enums<"tarea_estado">,
): Promise<void> {
  const { supabase, user } = await requireUser();
  if (!ESTADOS.includes(estado)) return;
  await supabase
    .from("tareas")
    .update({ estado })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath(ROUTE);
}

export async function deleteTarea(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("tareas").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(ROUTE);
}
