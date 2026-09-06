import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/database.types";

export type Evidencia = Tables<"evidencia">;

export const BUCKET = "evidencia";

export const TIPOS: Enums<"evidencia_tipo">[] = [
  "documento",
  "captura",
  "nota",
  "organigrama",
  "otro",
];

export const TIPO_LABEL: Record<Enums<"evidencia_tipo">, string> = {
  documento: "Documento",
  captura: "Captura",
  nota: "Nota",
  organigrama: "Organigrama",
  otro: "Otro",
};

export const MAX_BYTES = 10 * 1024 * 1024;

export type PreviewKind = "image" | "pdf" | null;

export function previewKind(mime: string | null): PreviewKind {
  if (!mime) return null;
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return null;
}

/** "tag1, tag2 ,tag1" → ["tag1","tag2"] (únicas, sin vacías, máx 20). */
export function parseEtiquetas(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function listEvidencia(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Evidencia[]> {
  const { data, error } = await supabase
    .from("evidencia")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** URLs firmadas (bucket privado) para cada evidencia. TTL 1 h. */
export async function signedUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60);

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
