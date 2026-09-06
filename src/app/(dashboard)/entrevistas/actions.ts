"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { TemasDetectados } from "@/lib/entrevistas";
import { fieldError, optionalStr, str, type FormState } from "@/lib/form";
import { generarResumen, hasAnthropicKey } from "@/lib/resumen";
import { requireUser } from "@/lib/supabase/require-user";

const ROUTE = "/entrevistas";

function parseMeta(formData: FormData) {
  const errors: Record<string, string> = {};

  const puesto = str(formData.get("puesto"));
  if (!puesto) errors.puesto = "Poné el puesto del entrevistado.";

  const duracionRaw = str(formData.get("duracion_estimada"));
  let duracion_estimada: number | null = null;
  if (duracionRaw) {
    const n = Number(duracionRaw);
    if (!Number.isInteger(n) || n <= 0 || n > 600)
      errors.duracion_estimada = "Duración en minutos (1 a 600).";
    else duracion_estimada = n;
  }

  return {
    errors,
    values: {
      puesto,
      area: optionalStr(formData.get("area")),
      fecha: optionalStr(formData.get("fecha")),
      duracion_estimada,
      consentimiento_registrado: formData.get("consentimiento") === "on",
    },
  };
}

export async function createEntrevista(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseMeta(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { data, error } = await supabase
    .from("entrevistas")
    .insert({ user_id: user.id, ...values })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la entrevista." };

  revalidatePath(ROUTE);
  redirect(`${ROUTE}/${data.id}`);
}

export async function updateEntrevista(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { errors, values } = parseMeta(formData);
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("entrevistas")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath(ROUTE);
  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true };
}

export async function deleteEntrevista(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("entrevistas").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(ROUTE);
  redirect(ROUTE);
}

/** Guarda el texto transcripto YA editado y anonimizado por el usuario. */
export async function saveTranscripcion(
  id: string,
  texto: string,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("entrevistas")
    .update({ transcripcion: texto.trim() || null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo guardar la transcripción." };

  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true };
}

/** Parte C: resumen vía API de Claude sobre el texto ya guardado. */
export async function generarResumenEntrevista(
  id: string,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!hasAnthropicKey()) {
    return {
      error:
        "Falta configurar ANTHROPIC_API_KEY en el servidor para generar resúmenes.",
    };
  }

  const { data: row } = await supabase
    .from("entrevistas")
    .select("transcripcion")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const transcripcion = row?.transcripcion?.trim();
  if (!transcripcion) {
    return { error: "Primero guardá la transcripción." };
  }

  let resumen: string;
  let temas: TemasDetectados;
  try {
    const out = await generarResumen(transcripcion);
    resumen = out.resumen;
    temas = out.temas;
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "No se pudo generar el resumen. Probá de nuevo.",
    };
  }

  const { error } = await supabase
    .from("entrevistas")
    .update({ resumen, temas_detectados: temas })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "El resumen se generó pero no se pudo guardar." };

  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true };
}

/** Edición manual del resumen (es asistencia, no verdad final). */
export async function saveResumen(
  id: string,
  texto: string,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("entrevistas")
    .update({ resumen: texto.trim() || null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No se pudo guardar el resumen." };
  revalidatePath(`${ROUTE}/${id}`);
  return { ok: true };
}
