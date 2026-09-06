"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { TranscriptionPanel } from "@/components/transcription/transcription-panel";
import { formatFecha, todayISO } from "@/lib/dates";
import { type Entrevista, parseTemas } from "@/lib/entrevistas";
import { OK } from "@/lib/form";

import {
  deleteEntrevista,
  generarResumenEntrevista,
  saveResumen,
  saveTranscripcion,
  updateEntrevista,
} from "../actions";

export function EntrevistaDetail({
  entrevista,
  resumenHabilitado,
}: {
  entrevista: Entrevista;
  resumenHabilitado: boolean;
}) {
  const [editMeta, setEditMeta] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/entrevistas"
        className="text-xs text-muted hover:text-ink hover:underline"
      >
        ← Entrevistas
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {entrevista.puesto}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          loading={deleting}
          className="text-danger hover:bg-danger-bg"
          onClick={() => {
            if (window.confirm("¿Borrar esta entrevista y su transcripción?")) {
              startDelete(() => deleteEntrevista(entrevista.id));
            }
          }}
        >
          Borrar
        </Button>
      </div>

      {/* Metadatos */}
      <section className="mt-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Datos</h2>
          {!editMeta && (
            <button
              type="button"
              onClick={() => setEditMeta(true)}
              className="min-h-9 rounded-md px-2 text-xs text-muted hover:text-ink"
            >
              Editar
            </button>
          )}
        </div>
        {editMeta ? (
          <MetaForm
            entrevista={entrevista}
            onDone={() => setEditMeta(false)}
            onCancel={() => setEditMeta(false)}
          />
        ) : (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Área</dt>
            <dd>{entrevista.area || "—"}</dd>
            <dt className="text-muted">Fecha</dt>
            <dd className="capitalize">
              {entrevista.fecha ? formatFecha(entrevista.fecha) : "—"}
            </dd>
            <dt className="text-muted">Duración</dt>
            <dd>
              {entrevista.duracion_estimada
                ? `${entrevista.duracion_estimada} min`
                : "—"}
            </dd>
            <dt className="text-muted">Consentimiento</dt>
            <dd>
              {entrevista.consentimiento_registrado
                ? "Registrado"
                : "Sin registrar"}
            </dd>
          </dl>
        )}
      </section>

      {/* Transcripción (client-side) */}
      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Transcripción</h2>
        <TranscriptionPanel
          initial={entrevista.transcripcion}
          onSave={(text) => saveTranscripcion(entrevista.id, text)}
        />
      </section>

      {/* Resumen (API de Claude) */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Resumen</h2>
        <ResumenPanel
          entrevista={entrevista}
          habilitado={resumenHabilitado}
        />
      </section>
    </div>
  );
}

function MetaForm({
  entrevista,
  onDone,
  onCancel,
}: {
  entrevista: Entrevista;
  onDone: () => void;
  onCancel: () => void;
}) {
  const wrapped = async (prev: typeof OK, formData: FormData) => {
    const res = await updateEntrevista(entrevista.id, prev, formData);
    if (res.ok) onDone();
    return res;
  };
  const [state, formAction] = useActionState(wrapped, OK);
  const fe = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      noValidate
      aria-label="Editar datos de la entrevista"
      className="mt-3 flex flex-col gap-3"
    >
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}
      <TextField
        label="Puesto del entrevistado"
        name="puesto"
        required
        defaultValue={entrevista.puesto}
        error={fe.puesto}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Área"
          name="area"
          optional
          defaultValue={entrevista.area ?? ""}
        />
        <TextField
          label="Fecha"
          name="fecha"
          type="date"
          optional
          max={todayISO()}
          defaultValue={entrevista.fecha ?? ""}
        />
      </div>
      <TextField
        label="Duración estimada"
        name="duracion_estimada"
        type="number"
        inputMode="numeric"
        min="1"
        max="600"
        optional
        hint="En minutos"
        defaultValue={
          entrevista.duracion_estimada
            ? String(entrevista.duracion_estimada)
            : ""
        }
        error={fe.duracion_estimada}
      />
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="consentimiento"
          defaultChecked={entrevista.consentimiento_registrado}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-[var(--primary)]"
        />
        <span>Registré el consentimiento informado del entrevistado.</span>
      </label>
      <div className="flex gap-2">
        <SubmitButton size="sm">Guardar</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ResumenPanel({
  entrevista,
  habilitado,
}: {
  entrevista: Entrevista;
  habilitado: boolean;
}) {
  const [generating, startGen] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState(entrevista.resumen ?? "");
  const [savedTick, setSavedTick] = useState(false);

  const temas = parseTemas(entrevista.temas_detectados);
  const tieneTranscripcion = Boolean(entrevista.transcripcion?.trim());

  function generar() {
    setError(null);
    startGen(async () => {
      const res = await generarResumenEntrevista(entrevista.id);
      if (res.error) setError(res.error);
      // el resultado se refleja al revalidar la ruta; recargamos el texto
      else window.location.reload();
    });
  }

  function guardar() {
    setError(null);
    setSavedTick(false);
    startSave(async () => {
      const res = await saveResumen(entrevista.id, text);
      if (res.error) setError(res.error);
      else setSavedTick(true);
    });
  }

  if (!entrevista.resumen) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        {!habilitado && (
          <Alert tone="warning" className="mb-3">
            Para generar resúmenes hace falta configurar{" "}
            <code>ANTHROPIC_API_KEY</code> en el servidor.
          </Alert>
        )}
        <p className="text-sm text-muted">
          Se le manda a la API de Claude <b>solo</b> el texto transcripto que
          guardaste. Devuelve resumen ejecutivo, tareas, fricciones y citas
          candidatas.
        </p>
        {error && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        <Button
          size="sm"
          className="mt-3"
          loading={generating}
          disabled={!habilitado || !tieneTranscripcion}
          onClick={generar}
        >
          Generar resumen
        </Button>
        {!tieneTranscripcion && (
          <p className="mt-2 text-xs text-muted">
            Guardá primero la transcripción.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {temas && (temas.tareas.length + temas.fricciones.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TemasList titulo="Tareas mencionadas" items={temas.tareas} />
          <TemasList titulo="Fricciones" items={temas.fricciones} />
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSavedTick(false);
        }}
        rows={14}
        className="w-full resize-y rounded-[0.625rem] border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed text-ink focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/50"
      />
      <p className="text-xs text-muted">
        El resumen es asistencia, no verdad final: editalo antes de usarlo en el
        informe.
      </p>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" loading={saving} onClick={guardar}>
          Guardar cambios
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={generating}
          disabled={!habilitado || !tieneTranscripcion}
          onClick={generar}
        >
          Regenerar
        </Button>
        {savedTick && <span className="text-xs text-success">Guardado.</span>}
      </div>
    </div>
  );
}

function TemasList({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-xs font-semibold text-muted">{titulo}</p>
      {items.length ? (
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted">—</p>
      )}
    </div>
  );
}
