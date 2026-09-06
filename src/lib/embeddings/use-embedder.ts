"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EmbedderPhase = "idle" | "loading-model" | "embedding" | "error";

type ProgressPayload = { progress?: number };

type WorkerMsg =
  | { type: "progress"; payload: ProgressPayload }
  | { type: "status"; payload: string }
  | { type: "done"; id: number; payload: number[][] }
  | { type: "error"; id: number; payload: string };

/**
 * Calcula embeddings de texto en el dispositivo (Supabase/gte-small, 384 dims).
 * El modelo se descarga una vez y queda cacheado en el navegador.
 */
export function useEmbedder() {
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const pending = useRef(
    new Map<
      number,
      { resolve: (v: number[][]) => void; reject: (e: Error) => void }
    >(),
  );

  const [phase, setPhase] = useState<EmbedderPhase>("idle");
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
      } else if (msg.type === "status" && msg.payload === "embedding") {
        setPhase("embedding");
        setModelProgress(null);
      } else if (msg.type === "done") {
        setPhase("idle");
        setModelProgress(null);
        pending.current.get(msg.id)?.resolve(msg.payload);
        pending.current.delete(msg.id);
      } else if (msg.type === "error") {
        setPhase("error");
        setModelProgress(null);
        setError(msg.payload);
        pending.current.get(msg.id)?.reject(new Error(msg.payload));
        pending.current.delete(msg.id);
      }
    };

    const bag = pending.current;
    return () => {
      worker.terminate();
      workerRef.current = null;
      bag.forEach((p) => p.reject(new Error("Cancelado.")));
      bag.clear();
    };
  }, []);

  const embed = useCallback((texts: string[]): Promise<number[][]> => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("El modelo no está listo."));
    if (texts.length === 0) return Promise.resolve([]);
    setError(null);
    const id = nextId.current++;
    return new Promise<number[][]>((resolve, reject) => {
      pending.current.set(id, { resolve, reject });
      worker.postMessage({ type: "embed", id, texts });
    });
  }, []);

  const embedOne = useCallback(
    async (text: string): Promise<number[]> => {
      const [v] = await embed([text]);
      return v ?? [];
    },
    [embed],
  );

  return { phase, modelProgress, error, embed, embedOne };
}
