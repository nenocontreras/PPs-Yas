"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { InterviewIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { formatFecha, todayISO } from "@/lib/dates";
import type { Entrevista } from "@/lib/entrevistas";
import { OK } from "@/lib/form";

import { createEntrevista } from "./actions";

export function EntrevistasView({
  entrevistas,
}: {
  entrevistas: Entrevista[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Entrevistas</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Nueva entrevista
          </Button>
        )}
      </div>

      <Alert tone="info" className="mt-4">
        El audio se transcribe en tu dispositivo y nunca se sube. A la IA del
        resumen solo se le manda el texto que vos revisaste y anonimizaste.
      </Alert>

      {adding && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium">Nueva entrevista</p>
          <MetaForm onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {entrevistas.length === 0 && !adding && (
          <EmptyState
            icon={<InterviewIcon />}
            title="Sin entrevistas todavía"
            description="Registrá una entrevista para cargar sus metadatos y después transcribirla."
            action={
              <Button size="sm" onClick={() => setAdding(true)}>
                Nueva entrevista
              </Button>
            }
          />
        )}

        {entrevistas.map((e) => (
          <Link
            key={e.id}
            href={`/entrevistas/${e.id}`}
            className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{e.puesto}</h2>
              {e.fecha && (
                <span className="shrink-0 text-xs capitalize text-muted">
                  {formatFecha(e.fecha)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {[
                e.area,
                e.transcripcion ? "transcripta" : "sin transcripción",
                e.resumen ? "con resumen" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetaForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction] = useActionState(createEntrevista, OK);
  const fe = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      noValidate
      aria-label="Nueva entrevista"
      className="flex flex-col gap-3"
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
        placeholder="Ej: Analista de RRHH"
        error={fe.puesto}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Área" name="area" optional placeholder="Ej: RRHH" />
        <TextField
          label="Fecha"
          name="fecha"
          type="date"
          optional
          max={todayISO()}
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
        hint="En minutos. Ej: 45"
        error={fe.duracion_estimada}
      />
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="consentimiento"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-[var(--primary)]"
        />
        <span>
          Registré el consentimiento informado del entrevistado.
          <span className="mt-0.5 block text-xs text-muted">
            Requisito del Reglamento de PPS (Art. 15°).
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <SubmitButton size="sm">Crear</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
