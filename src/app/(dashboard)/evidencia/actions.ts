"use server";

import { revalidatePath } from "next/cache";

import type { Enums } from "@/lib/database.types";
import { BUCKET, TIPOS, parseEtiquetas } from "@/lib/evidencia";
import { fieldError, optionalStr, str, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/supabase/require-user";

const ROUTE = "/evidencia";

type Tipo = Enums<"evidencia_tipo">;

function coerceTipo(raw: string): Tipo {
  return TIPOS.includes(raw as Tipo) ? (raw as Tipo) : "otro";
}

type NewEvidencia = {
  titulo: string;
  tipo: string;
  etiquetas: string[];
  fecha_captura: string | null;
  notas: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
};

/** El archivo ya se subió a Storage desde el navegador; acá solo va la fila. */
export async function createEvidencia(
  input: NewEvidencia,
): Promise<FormState> {
  const { supabase, user } = await requireUser();

  // El primer segmento del path SIEMPRE tiene que ser la carpeta del usuario
  // (además la policy de storage.objects lo obliga; esto es defensa en capas).
  const [firstSegment, ...rest] = input.storage_path.split("/");
  if (
    firstSegment !== user.id ||
    rest.length === 0 ||
    input.storage_path.includes("..")
  ) {
    return { error: "Ruta de archivo inválida." };
  }

  const titulo = input.titulo.trim();
  if (!titulo) {
    await supabase.storage.from(BUCKET).remove([input.storage_path]);
    return { fieldErrors: { titulo: "Poné un título." } };
  }

  const { error } = await supabase.from("evidencia").insert({
    user_id: user.id,
    titulo,
    tipo: coerceTipo(input.tipo),
    etiquetas: input.etiquetas,
    fecha_captura: input.fecha_captura || null,
    notas: input.notas,
    storage_path: input.storage_path,
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
  });

  if (error) {
    // no dejar el archivo huérfano en Storage
    await supabase.storage.from(BUCKET).remove([input.storage_path]);
    return { error: "No se pudo guardar la evidencia." };
  }

  revalidatePath(ROUTE);
  return { ok: true };
}

/** Edición de metadatos (no cambia el archivo). */
export async function updateEvidencia(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const titulo = str(formData.get("titulo"));
  const errors: Record<string, string> = {};
  if (!titulo) errors.titulo = "Poné un título.";
  const fe = fieldError(errors);
  if (fe) return fe;

  const { error } = await supabase
    .from("evidencia")
    .update({
      titulo,
      tipo: coerceTipo(str(formData.get("tipo"))),
      etiquetas: parseEtiquetas(str(formData.get("etiquetas"))),
      fecha_captura: optionalStr(formData.get("fecha_captura")),
      notas: optionalStr(formData.get("notas")),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function deleteEvidencia(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const { data: row } = await supabase
    .from("evidencia")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Borrar primero el archivo. Si falla, no borramos la fila: así el usuario
  // puede reintentar en vez de quedar con un archivo huérfano en Storage.
  if (row?.storage_path) {
    const { error: rmErr } = await supabase.storage
      .from(BUCKET)
      .remove([row.storage_path]);
    if (rmErr) {
      return { error: "No se pudo borrar el archivo. Reintentá." };
    }
  }

  const { error } = await supabase
    .from("evidencia")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No se pudo borrar la evidencia." };

  revalidatePath(ROUTE);
  return { ok: true };
}
