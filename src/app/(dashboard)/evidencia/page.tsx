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

  const withUrls = items.map((e) => ({
    ...e,
    signedUrl: urls.get(e.storage_path) ?? null,
  }));

  return <EvidenciaView items={withUrls} userId={user.id} />;
}
