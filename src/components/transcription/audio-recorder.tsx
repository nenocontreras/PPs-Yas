"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Graba audio del micrófono o toma un archivo. El Blob resultante se pasa por
 * `onAudio` y de ahí va SOLO al worker de transcripción — nunca a la red.
 */
export function AudioRecorder({
  onAudio,
  disabled,
}: {
  onAudio: (blob: Blob) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        if (blob.size > 0) onAudio(blob);
      };
      rec.start();
      recorderRef.current = rec;
      setSecs(0);
      setRecording(true);
    } catch {
      setMicError(
        "No se pudo acceder al micrófono. Revisá los permisos del navegador.",
      );
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <>
            <Button variant="danger" size="sm" onClick={stop}>
              Detener
            </Button>
            <span className="flex items-center gap-2 font-mono text-sm tabular-nums">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              {fmt(secs)}
            </span>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={start}
            disabled={disabled}
          >
            Grabar con el micrófono
          </Button>
        )}

        <span className="text-xs text-muted">o</span>

        <label
          className={`inline-flex min-h-11 cursor-pointer items-center rounded-[0.625rem] border border-line bg-surface px-3 text-[13px] font-semibold hover:bg-surface-2 ${
            disabled || recording ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Subir archivo de audio
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            disabled={disabled || recording}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAudio(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {micError && (
        <p className="text-xs text-danger" role="alert">
          {micError}
        </p>
      )}
      <p className="text-xs text-muted">
        El audio se procesa en tu dispositivo y no se sube a ningún servidor.
      </p>
    </div>
  );
}
