"use server";

import { revalidatePath } from "next/cache";

import type { Enums } from "@/lib/database.types";
import { fieldError, str, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/supabase/require-user";

const ROUTE = "/calendario";
const TIPOS: Enums<"evento_tipo">[] = ["jornada", "entrega", "hito", "otro"];

function parseEvento(formData: FormData) {
  const errors: Record<string, string> = {};

  const titulo = str(formData.get("titulo"));
  if (!titulo) errors.titulo = "Poné un título.";

  const fecha = str(formData.get("fecha"));
  if (!fecha) errors.fecha = "Elegí la fecha.";

  const tipoRaw = str(formData.get("tipo"));
  const tipo = TIPOS.includes(tipoRaw as Enums<"evento_tipo">)
    ? (tipoRaw as Enums<"evento_tipo">)
    : "otro";

  return { errors, values: { titulo, fecha, tipo } };
}

export async function createEvento(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseEvento(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("eventos")
    .insert({ user_id: user.id, ...values });
  if (error) return { error: "No se pudo guardar el evento." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function updateEvento(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseEvento(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("eventos")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function deleteEvento(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("eventos").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(ROUTE);
}
