"use client";

import { useActionState, useState, useTransition } from "react";

import { LogbookIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";
import { HoursProgress } from "@/components/ui/hours-progress";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { type Jornada, totalHoras } from "@/lib/bitacora";
import { formatFecha, todayISO } from "@/lib/dates";
import { type FormState, OK } from "@/lib/form";
import { formatHoras } from "@/lib/pps";

import { createJornada, deleteJornada, updateJornada } from "./actions";

export function BitacoraView({ jornadas }: { jornadas: Jornada[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const total = totalHoras(jornadas);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Bitácora</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Registrar jornada
          </Button>
        )}
      </div>

      <HoursProgress horas={total} className="mt-4" />

      {adding && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium">Nueva jornada</p>
          <JornadaForm
            action={createJornada}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {jornadas.length === 0 && !adding && (
          <EmptyState
            icon={<LogbookIcon />}
            title="Todavía no registraste jornadas"
            description="Cargá tu primera jornada de práctica para empezar a sumar horas."
            action={
              <Button size="sm" onClick={() => setAdding(true)}>
                Registrar jornada
              </Button>
            }
          />
        )}

        {jornadas.map((j) =>
          editingId === j.id ? (
            <div
              key={j.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="mb-3 text-sm font-medium">Editar jornada</p>
              <JornadaForm
                jornada={j}
                action={updateJornada.bind(null, j.id)}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <JornadaCard
              key={j.id}
              jornada={j}
              onEdit={() => setEditingId(j.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function JornadaCard({
  jornada,
  onEdit,
}: {
  jornada: Jornada;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold capitalize">
          {formatFecha(jornada.fecha)}
        </h2>
        <span className="font-mono text-sm font-semibold tabular-nums text-muted">
          {formatHoras(Number(jornada.horas))} hs
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">
        {jornada.tareas_realizadas}
      </p>
      {jornada.observaciones && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-muted">
          {jornada.observaciones}
        </p>
      )}
      <div className="mt-3 flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={pending}
          className="text-danger hover:bg-danger-bg"
          onClick={() => {
            if (window.confirm("¿Borrar esta jornada?")) {
              startTransition(() => deleteJornada(jornada.id));
            }
          }}
        >
          Borrar
        </Button>
      </div>
    </article>
  );
}

function JornadaForm({
  jornada,
  action,
  onDone,
  onCancel,
}: {
  jornada?: Jornada;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const wrapped = async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) onDone();
    return result;
  };
  const [state, formAction] = useActionState(wrapped, OK);
  const fe = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      noValidate
      aria-label={jornada ? "Editar jornada" : "Nueva jornada"}
      className="flex flex-col gap-3"
    >
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Fecha"
          name="fecha"
          type="date"
          required
          max={todayISO()}
          defaultValue={jornada?.fecha ?? todayISO()}
          error={fe.fecha}
        />
        <TextField
          label="Horas"
          name="horas"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0.5"
          max="24"
          required
          hint="Ej: 4 o 4.5"
          defaultValue={jornada ? String(jornada.horas) : ""}
          error={fe.horas}
        />
      </div>
      <Textarea
        label="Tareas realizadas"
        name="tareas_realizadas"
        required
        defaultValue={jornada?.tareas_realizadas ?? ""}
        error={fe.tareas_realizadas}
      />
      <Textarea
        label="Observaciones"
        name="observaciones"
        optional
        rows={2}
        defaultValue={jornada?.observaciones ?? ""}
      />
      <div className="flex gap-2">
        <SubmitButton size="sm">Guardar</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
