/// <reference lib="webworker" />
/**
 * Web Worker de transcripción. Carga Whisper y transcribe ENTERAMENTE en el
 * dispositivo. El audio llega como Float32Array desde el hilo principal y NUNCA
 * sale del navegador (confidentiality-guard, regla 1).
 *
 * Lo único que este worker descarga de la red es el modelo, desde el CDN de
 * Hugging Face, al navegador del usuario. Eso está permitido: es cliente ↔ CDN
 * de modelos, no sube datos del usuario a ningún lado.
 *
 * Backend: WASM (con threads si el navegador tiene aislamiento cross-origin —
 * ver los headers COOP/COEP de `/entrevistas/*` en next.config). NO usamos
 * WebGPU: en transformers.js v4 + whisper se cuelga al reinicializar una segunda
 * sesión en la misma página (cambiar de entrevista, reintentar), sin tirar error.
 * WASM es más lento pero no se traba, y para clips cortos alcanza.
 */
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

const MODEL = "onnx-community/whisper-base";
const TASK = "automatic-speech-recognition";

// q8: ~75 MB de descarga (vs ~270 MB en fp32) y más rápido en WASM, con pérdida
// de calidad mínima para `base`.
const DTYPE = "q8" as const;

type TranscribeMsg = { type: "transcribe"; audio: Float32Array };

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string }>;

let transcriberPromise: Promise<Transcriber> | null = null;

function load(): Promise<Transcriber> {
  return pipeline(TASK, MODEL, {
    dtype: DTYPE,
    progress_callback: (p: unknown) =>
      self.postMessage({ type: "progress", payload: p }),
  }) as Promise<Transcriber>;
}

self.onmessage = async (e: MessageEvent<TranscribeMsg>) => {
  if (e.data?.type !== "transcribe") return;
  try {
    if (!transcriberPromise) transcriberPromise = load();
    const transcriber = await transcriberPromise;

    self.postMessage({ type: "status", payload: "transcribing" });

    const output = await transcriber(e.data.audio, {
      language: "spanish",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    self.postMessage({ type: "done", payload: output.text.trim() });
  } catch (err) {
    transcriberPromise = null; // permitir reintentar
    self.postMessage({
      type: "error",
      payload:
        err instanceof Error ? err.message : "No se pudo transcribir el audio.",
    });
  }
};
