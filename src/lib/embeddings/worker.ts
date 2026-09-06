/// <reference lib="webworker" />
/**
 * Web Worker de embeddings para la búsqueda semántica. Igual que el de
 * transcripción: corre 100% en el dispositivo. El texto que se embebe es el que
 * el usuario ya generó/anonimizó; el modelo se descarga del CDN de Hugging Face
 * al navegador (cliente ↔ CDN, permitido).
 */
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

const MODEL = "Supabase/gte-small"; // 384 dims, ~35 MB
const TASK = "feature-extraction";

type EmbedMsg = { type: "embed"; id: number; texts: string[] };

type Extractor = (
  text: string | string[],
  opts: Record<string, unknown>,
) => Promise<{ tolist: () => number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

function load(): Promise<Extractor> {
  const progress_callback = (p: unknown) =>
    self.postMessage({ type: "progress", payload: p });
  return pipeline(TASK, MODEL, {
    device: "webgpu",
    progress_callback,
  }).catch(() => pipeline(TASK, MODEL, { progress_callback })) as Promise<Extractor>;
}

self.onmessage = async (e: MessageEvent<EmbedMsg>) => {
  if (e.data?.type !== "embed") return;
  const { id, texts } = e.data;
  try {
    if (!extractorPromise) extractorPromise = load();
    const extractor = await extractorPromise;
    self.postMessage({ type: "status", payload: "embedding" });

    const out = await extractor(texts, { pooling: "mean", normalize: true });
    self.postMessage({ type: "done", id, payload: out.tolist() });
  } catch (err) {
    extractorPromise = null;
    self.postMessage({
      type: "error",
      id,
      payload:
        err instanceof Error ? err.message : "No se pudieron calcular los embeddings.",
    });
  }
};
