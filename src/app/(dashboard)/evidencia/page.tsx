import type { Metadata } from "next";

import { listEvidencia, signedUrls } from "@/lib/evidencia";
import { requireUser } from "@/lib/supabase/require-user";

import { EvidenciaView } from "./evidencia-view";

export const metadata: Metadata = { title: "Evidencia" };

export default async function EvidenciaPage() {
  const { supabase, user } = await requireUser();
  const items = await listEvidencia(supabase, user.id);

  // Bucket privado: URL firmada (TTL 1 h) para ver/descargar cada archivo.
  const urls = await signedUrls(
    supabase,
    items.map((e) => e.storage_path),
  );

  // Solo los campos que usa la vista: no mandamos user_id ni storage_path al
  // bundle del cliente.
  const items_ = items.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    etiquetas: e.etiquetas,
    fecha_captura: e.fecha_captura,
    notas: e.notas,
    mime_type: e.mime_type,
    size_bytes: e.size_bytes,
    signedUrl: urls.get(e.storage_path) ?? null,
  }));

  return <EvidenciaView items={items_} userId={user.id} />;
}
