"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { decodeToMono16k } from "./audio";
import { getTranscriptionWorker } from "./worker-client";

export type TranscriberPhase =
  | "idle"
  | "decoding"
  | "loading-model"
  | "transcribing"
  | "error";

type ProgressPayload = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type WorkerMsg =
  | { type: "progress"; payload: ProgressPayload }
  | { type: "status"; payload: string }
  | { type: "debug"; payload: string }
  | { type: "done"; payload: string }
  | { type: "error"; payload: string };

/**
 * Si el worker no dice nada en este tiempo, algo se colgó. Generoso: en un
 * celular, crear la sesión de ONNX desde el modelo puede tardar 1-2 min sin
 * emitir eventos.
 */
const WATCHDOG_MS = 300_000;

/**
 * Hook para transcribir audio en el dispositivo con Whisper. Devuelve el estado
 * del proceso y una función `transcribe(blob)` que resuelve con el texto.
 * El worker es único para toda la pestaña (ver `worker-client`); el modelo
 * queda cacheado en el navegador tras la primera descarga.
 */
export function useTranscriber() {
  const pending = useRef<{
    resolve: (text: string) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  // bytes por archivo, para un % agregado que no salte de un archivo a otro
  const bytesByFile = useRef<Map<string, { loaded: number; total: number }>>(
    new Map(),
  );

  const [phase, setPhase] = useState<TranscriberPhase>("idle");
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);

  const stepRef = useRef<string | null>(null);

  const failStuck = useCallback(() => {
    setPhase("error");
    setModelProgress(null);
    setError(
      `La transcripción se colgó${
        stepRef.current ? ` en el paso "${stepRef.current}"` : ""
      }. Recargá la página e intentá de nuevo.`,
    );
    pending.current?.reject(new Error("transcripción colgada"));
    pending.current = null;
  }, []);

  const armWatchdog = useCallback(() => {
    clearWatchdog();
    watchdog.current = setTimeout(failStuck, WATCHDOG_MS);
  }, [clearWatchdog, failStuck]);

  useEffect(() => {
    const worker = getTranscriptionWorker();

    const onMessage = (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data;
      // Cualquier señal de vida reinicia el watchdog.
      if (pending.current) armWatchdog();

      if (msg.type === "debug") {
        stepRef.current = msg.payload;
        setStep(msg.payload);
      } else if (msg.type === "progress") {
        setPhase("loading-model");
        const { file, loaded, total } = msg.payload;
        if (file && typeof loaded === "number" && typeof total === "number") {
          bytesByFile.current.set(file, { loaded, total });
        }
        let sumLoaded = 0;
        let sumTotal = 0;
        for (const b of bytesByFile.current.values()) {
          sumLoaded += b.loaded;
          sumTotal += b.total;
        }
        setModelProgress(
          sumTotal > 0
            ? Math.min(100, Math.round((sumLoaded / sumTotal) * 100))
            : null,
        );
      } else if (msg.type === "status" && msg.payload === "transcribing") {
        setPhase("transcribing");
        setModelProgress(null);
      } else if (msg.type === "done") {
        clearWatchdog();
        setPhase("idle");
        setModelProgress(null);
        pending.current?.resolve(msg.payload);
        pending.current = null;
      } else if (msg.type === "error") {
        clearWatchdog();
        setPhase("error");
        setModelProgress(null);
        setError(msg.payload);
        pending.current?.reject(new Error(msg.payload));
        pending.current = null;
      }
    };

    worker.addEventListener("message", onMessage);
    return () => {
      worker.removeEventListener("message", onMessage);
      clearWatchdog();
      pending.current?.reject(new Error("Transcripción cancelada."));
      pending.current = null;
    };
  }, [armWatchdog, clearWatchdog]);

  const transcribe = useCallback(
    async (file: Blob): Promise<string> => {
      const worker = getTranscriptionWorker();
      setError(null);
      setPhase("decoding");

      const audio = await decodeToMono16k(file);
      if (audio.length === 0) {
        setPhase("error");
        setError("El archivo no tiene audio que transcribir.");
        throw new Error("audio vacío");
      }

      setPhase("loading-model");
      setModelProgress(null);
      setStep(null);
      stepRef.current = null;
      bytesByFile.current.clear();
      armWatchdog();
      return new Promise<string>((resolve, reject) => {
        pending.current = { resolve, reject };
        worker.postMessage({ type: "transcribe", audio }, [audio.buffer]);
      });
    },
    [armWatchdog],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setModelProgress(null);
    setStep(null);
    setError(null);
  }, []);

  return { phase, modelProgress, step, error, transcribe, reset };
}
