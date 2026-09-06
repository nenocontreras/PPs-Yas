"use server";

import { formatFecha } from "@/lib/dates";
import type { DocIndexable, Resultado } from "@/lib/busqueda";
import { requireUser } from "@/lib/supabase/require-user";

/** Junta todo el texto indexable del usuario (resúmenes, jornadas, evidencia). */
export async function getContenidoIndexable(): Promise<DocIndexable[]> {
  const { supabase, user } = await requireUser();

  const [entrevistas, jornadas, evidencia] = await Promise.all([
    supabase
      .from("entrevistas")
      .select("id, puesto, area, fecha, resumen, transcripcion")
      .eq("user_id", user.id),
    supabase
      .from("jornadas")
      .select("id, fecha, tareas_realizadas, observaciones")
      .eq("user_id", user.id),
    supabase
      .from("evidencia")
      .select("id, titulo, notas, etiquetas")
      .eq("user_id", user.id),
  ]);

  const docs: DocIndexable[] = [];

  for (const e of entrevistas.data ?? []) {
    const contenido = (e.resumen ?? e.transcripcion ?? "").trim();
    if (!contenido) continue;
    docs.push({
      fuente: "entrevista",
      fuente_id: e.id,
      titulo: [
        "Entrevista",
        e.puesto,
        e.fecha ? formatFecha(e.fecha) : null,
      ]
        .filter(Boolean)
        .join(" · "),
      contenido,
    });
  }

  for (const j of jornadas.data ?? []) {
    const contenido = [j.tareas_realizadas, j.observaciones]
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!contenido) continue;
    docs.push({
      fuente: "jornada",
      fuente_id: j.id,
      titulo: `Jornada · ${formatFecha(j.fecha)}`,
      contenido,
    });
  }

  for (const ev of evidencia.data ?? []) {
    const contenido = [
      ev.titulo,
      ev.notas,
      ev.etiquetas.length ? `Etiquetas: ${ev.etiquetas.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(". ")
      .trim();
    if (!contenido) continue;
    docs.push({
      fuente: "evidencia",
      fuente_id: ev.id,
      titulo: `Evidencia · ${ev.titulo}`,
      contenido,
    });
  }

  return docs;
}

/**
 * Actualiza el índice del usuario: upsert de los documentos actuales y borrado
 * de los que ya no están. Se hace en ese orden (no delete-all primero) para que
 * el índice no quede vacío si algo falla a mitad.
 */
export async function reindexar(
  docs: (DocIndexable & { embedding: number[] })[],
): Promise<{ ok?: boolean; count?: number; error?: string }> {
  const { supabase, user } = await requireUser();

  const rows = docs
    .filter((d) => Array.isArray(d.embedding) && d.embedding.length === 384)
    .map((d) => ({
      user_id: user.id,
      fuente: d.fuente,
      fuente_id: d.fuente_id,
      titulo: d.titulo,
      contenido: d.contenido,
      embedding: JSON.stringify(d.embedding),
    }));

  if (rows.length === 0) {
    const { error } = await supabase
      .from("documentos_indexados")
      .delete()
      .eq("user_id", user.id);
    return error
      ? { error: "No se pudo actualizar el índice." }
      : { ok: true, count: 0 };
  }

  const { data: kept, error: upErr } = await supabase
    .from("documentos_indexados")
    .upsert(rows, { onConflict: "user_id,fuente,fuente_id" })
    .select("id");
  if (upErr || !kept) {
    return { error: "No se pudieron guardar los embeddings." };
  }

  const keptIds = kept.map((r) => `"${r.id}"`).join(",");
  await supabase
    .from("documentos_indexados")
    .delete()
    .eq("user_id", user.id)
    .not("id", "in", `(${keptIds})`);

  return { ok: true, count: rows.length };
}

export async function buscar(
  embedding: number[],
): Promise<{ resultados?: Resultado[]; error?: string }> {
  const { supabase } = await requireUser();

  if (!Array.isArray(embedding) || embedding.length !== 384) {
    return { error: "Consulta inválida." };
  }

  const { data, error } = await supabase.rpc("match_documentos", {
    query_embedding: JSON.stringify(embedding),
    match_count: 8,
  });

  if (error) return { error: "No se pudo buscar. ¿Actualizaste el índice?" };
  return { resultados: (data ?? []) as Resultado[] };
}

/** Cuántos documentos hay indexados (para el estado del botón). */
export async function contarIndice(): Promise<number> {
  const { supabase, user } = await requireUser();
  const { count } = await supabase
    .from("documentos_indexados")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}
