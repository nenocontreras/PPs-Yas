/// <reference lib="webworker" />
/**
 * Web Worker de transcripción. Carga Whisper y transcribe ENTERAMENTE en el
 * dispositivo. El audio llega como Float32Array desde el hilo principal y NUNCA
 * sale del navegador (confidentiality-guard, regla 1).
 *
 * Lo único que este worker descarga de la red es el modelo (CDN de Hugging Face)
 * y el runtime WASM de ONNX (CDN de jsDelivr) — cliente ↔ CDN, sin subir datos.
 *
 * Backend: WASM single-thread. NO WebGPU (en transformers.js v4 + whisper se
 * cuelga al reinicializar). `numThreads = 1` evita depender de SharedArrayBuffer
 * / crossOriginIsolated, que es una fuente de cuelgues silenciosos.
 */
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
const wasmEnv = env.backends?.onnx?.wasm;
if (wasmEnv) {
  wasmEnv.numThreads = 1;
  wasmEnv.proxy = false;
}

declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

const MODEL = "onnx-community/whisper-base";
const TASK = "automatic-speech-recognition";
const DTYPE = "q8" as const;

type TranscribeMsg = { type: "transcribe"; audio: Float32Array };

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string }>;

let transcriberPromise: Promise<Transcriber> | null = null;

/** Traza el paso actual — se ve en la consola y en la UI. */
function trace(step: string) {
  console.log("[transcribe]", step);
  self.postMessage({ type: "debug", payload: step });
}

function load(): Promise<Transcriber> {
  trace("descargando/cargando modelo");
  return pipeline(TASK, MODEL, {
    dtype: DTYPE,
    progress_callback: (p: unknown) =>
      self.postMessage({ type: "progress", payload: p }),
  }) as Promise<Transcriber>;
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
