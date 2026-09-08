/// <reference lib="webworker" />
/**
 * Web Worker de transcripción. Carga Whisper y transcribe ENTERAMENTE en el
 * dispositivo. El audio llega como Float32Array desde el hilo principal y NUNCA
 * sale del navegador (confidentiality-guard, regla 1).
 *
 * Lo único que baja de la red es el modelo (CDN de Hugging Face); el runtime
 * WASM de ONNX se sirve de nuestro propio origen (/ort/). Cliente ↔ CDN, sin
 * subir datos.
 *
 * Backend: WASM single-thread (sin WebGPU, sin threads → sin depender de
 * SharedArrayBuffer/crossOriginIsolated, dos fuentes de cuelgue).
 */
import { pipeline, env, type DataType } from "@huggingface/transformers";

env.allowLocalModels = false;
const wasmEnv = env.backends?.onnx?.wasm;
if (wasmEnv) {
  wasmEnv.numThreads = 1;
  wasmEnv.proxy = false;
  wasmEnv.wasmPaths = "/ort/";
}

declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

console.log("[transcribe] worker cargado");

// `small` transcribe bastante mejor que `base` en español; pesa ~240 MB en q8
// (una sola vez por dispositivo, después queda en caché).
const MODEL = "onnx-community/whisper-small";
const TASK = "automatic-speech-recognition";

// `q8` (~240 MB) anda con onnxruntime-web 1.22 (transformers.js v3). `fp16`
// (~460 MB) como último recurso si algún navegador raro falla con q8.
const DTYPES: DataType[] = ["q8", "fp16"];

type TranscribeMsg = { type: "transcribe"; audio: Float32Array };

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string }>;

let transcriberPromise: Promise<Transcriber> | null = null;

// La firma tipada de `pipeline` genera una unión enorme (todas las tasks) que
// hace explotar a tsc. Acá solo nos importa la de ASR.
const asrPipeline = pipeline as (
  task: string,
  model: string,
  opts: Record<string, unknown>,
) => Promise<Transcriber>;

/** Traza el paso actual — se ve en la consola y en la UI. */
function trace(step: string) {
  console.log("[transcribe]", step);
  self.postMessage({ type: "debug", payload: step });
}

async function load(): Promise<Transcriber> {
  const progress_callback = (p: unknown) =>
    self.postMessage({ type: "progress", payload: p });

  let lastErr: unknown;
  for (const dtype of DTYPES) {
    try {
      trace(`cargando modelo (${dtype})`);
      return await asrPipeline(TASK, MODEL, { dtype, progress_callback });
    } catch (e) {
      lastErr = e;
      console.warn(`[transcribe] falló con dtype=${dtype}:`, e);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("No se pudo cargar el modelo de transcripción.");
}

self.onmessage = async (e: MessageEvent<TranscribeMsg>) => {
  if (e.data?.type !== "transcribe") return;
  try {
    trace("audio recibido");
    if (!transcriberPromise) transcriberPromise = load();
    const transcriber = await transcriberPromise;
    trace("modelo listo");

    self.postMessage({ type: "status", payload: "transcribing" });

    const output = await transcriber(e.data.audio, {
      language: "spanish",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
      // Corta los loops de repetición típicos de Whisper en tramos poco claros.
      no_repeat_ngram_size: 3,
    });

    trace("inferencia ok");
    self.postMessage({ type: "done", payload: output.text.trim() });
  } catch (err) {
    transcriberPromise = null; // permitir reintentar
    console.error("[transcribe] error", err);
    self.postMessage({
      type: "error",
      payload:
        err instanceof Error ? err.message : "No se pudo transcribir el audio.",
    });
  }
};
