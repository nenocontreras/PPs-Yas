"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { decodeToMono16k } from "./audio";

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
};

type WorkerMsg =
  | { type: "progress"; payload: ProgressPayload }
  | { type: "status"; payload: string }
  | { type: "done"; payload: string }
  | { type: "error"; payload: string };

/**
 * Hook para transcribir audio en el dispositivo con Whisper. Devuelve el estado
 * del proceso y una función `transcribe(blob)` que resuelve con el texto.
 * El worker vive lo que vive el componente; el modelo queda cacheado en el
 * navegador tras la primera descarga.
 */
export function useTranscriber() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<{
    resolve: (text: string) => void;
    reject: (e: Error) => void;
  } | null>(null);

  const [phase, setPhase] = useState<TranscriberPhase>("idle");
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data;
      if (msg.type === "progress") {
        if (typeof msg.payload.progress === "number") {
          setPhase("loading-model");
          setModelProgress(Math.min(100, Math.round(msg.payload.progress)));
        }
      } else if (msg.type === "status" && msg.payload === "transcribing") {
        setPhase("transcribing");
        setModelProgress(null);
      } else if (msg.type === "done") {
        setPhase("idle");
        setModelProgress(null);
        pending.current?.resolve(msg.payload);
        pending.current = null;
      } else if (msg.type === "error") {
        setPhase("error");
        setModelProgress(null);
        setError(msg.payload);
        pending.current?.reject(new Error(msg.payload));
        pending.current = null;
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      pending.current?.reject(new Error("Transcripción cancelada."));
      pending.current = null;
    };
  }, []);

  const transcribe = useCallback(async (file: Blob): Promise<string> => {
    const worker = workerRef.current;
    if (!worker) throw new Error("El transcriptor no está listo.");
    setError(null);
    setPhase("decoding");

    const audio = await decodeToMono16k(file);
    if (audio.length === 0) {
      setPhase("error");
      setError("El archivo no tiene audio que transcribir.");
      throw new Error("audio vacío");
    }

    setPhase("loading-model");
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
      worker.postMessage({ type: "transcribe", audio }, [audio.buffer]);
    });
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setModelProgress(null);
    setError(null);
  }, []);

  return { phase, modelProgress, error, transcribe, reset };
}
