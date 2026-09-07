"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranscriber } from "@/lib/transcription/use-transcriber";

import { AudioRecorder } from "./audio-recorder";

export function TranscriptionPanel({
  initial,
  onSave,
}: {
  initial: string | null;
  onSave: (text: string) => Promise<{ error?: string; ok?: boolean }>;
}) {
  const { phase, modelProgress, error, transcribe } = useTranscriber();
  const [text, setText] = useState(initial ?? "");
  const [showRecorder, setShowRecorder] = useState(!initial);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const busy = phase === "decoding" || phase === "loading-model" || phase === "transcribing";

  async function handleAudio(blob: Blob) {
    setSaved(false);
    try {
      const result = await transcribe(blob);
      setText((t) => (t.trim() ? `${t.trim()}\n\n${result}` : result));
      setShowRecorder(false);
    } catch {
      // el error ya lo muestra el hook
    }
  }

  function save() {
    setSaveError(null);
    setSaved(false);
    startSaving(async () => {
      const res = await onSave(text.trim());
      if (res.error) setSaveError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {showRecorder && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <AudioRecorder onAudio={handleAudio} disabled={busy} />
        </div>
      )}

      {busy && (
        <div className="rounded-xl border border-line bg-surface p-4">
          {phase === "decoding" && (
            <p className="text-sm text-muted">Preparando el audio…</p>
          )}
          {phase === "loading-model" && (
            <>
              <p className="text-sm font-medium">
                Descargando el modelo de transcripción
                {modelProgress != null ? ` · ${modelProgress}%` : "…"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Solo la primera vez (~75 MB). Después queda guardado en el
                navegador y la transcripción es casi instantánea.
              </p>
              {modelProgress != null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${modelProgress}%` }}
                  />
                </div>
              )}
            </>
          )}
          {phase === "transcribing" && (
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              Transcribiendo… los audios largos tardan un poco más.
            </p>
          )}
        </div>
      )}

      {phase === "error" && error && (
        <Alert tone="danger">{error}</Alert>
      )}

      {(text || !showRecorder) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="transcripcion" className="text-[13px] font-medium">
              Transcripción
            </label>
            {!showRecorder && (
              <button
                type="button"
                onClick={() => setShowRecorder(true)}
                disabled={busy}
                className="min-h-9 rounded-md px-2 text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                Grabar / subir otro audio
              </button>
            )}
          </div>
          <textarea
            id="transcripcion"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSaved(false);
            }}
            rows={12}
            placeholder="El texto transcripto aparece acá. Corregilo y anonimizá los nombres antes de guardar."
            className="w-full resize-y rounded-[0.625rem] border border-line-strong bg-surface p-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/50"
          />
          <p className="text-xs text-warning">
            Antes de guardar: reemplazá nombres de personas y de la empresa por
            genéricos (“el analista”, “la empresa”). Lo que guardes queda en tu
            cuenta y puede usarse para el resumen.
          </p>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={save} loading={saving} disabled={!text.trim()}>
              Guardar transcripción
            </Button>
            {saved && <span className="text-xs text-success">Guardado.</span>}
          </div>
          {saveError && (
            <p className="text-xs text-danger" role="alert">
              {saveError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
