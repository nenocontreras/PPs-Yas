"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { TasksIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import {
  ESTADOS,
  StatusPill,
  estadoLabel,
} from "@/components/ui/status-pill";
import type { Enums } from "@/lib/database.types";
import { type FormState, OK } from "@/lib/form";
import { cn } from "@/lib/cn";
import type { Tarea } from "@/lib/tareas";

import {
  createTarea,
  deleteTarea,
  setTareaEstado,
  updateTarea,
} from "./actions";

type Estado = Enums<"tarea_estado">;
type Filtro = "todas" | Estado;

export function TareasView({ tareas }: { tareas: Tarea[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const counts = useMemo(() => {
    const c: Record<Estado, number> = {
      pendiente: 0,
      en_curso: 0,
      completada: 0,
    };
    for (const t of tareas) c[t.estado]++;
    return c;
  }, [tareas]);

  const visibles =
    filtro === "todas" ? tareas : tareas.filter((t) => t.estado === filtro);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Tareas</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Nueva tarea
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FiltroChip active={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas ({tareas.length})
        </FiltroChip>
        {ESTADOS.map((e) => (
          <FiltroChip
            key={e}
            active={filtro === e}
            onClick={() => setFiltro(e)}
          >
            {estadoLabel(e)} ({counts[e]})
          </FiltroChip>
        ))}
      </div>

      {adding && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium">Nueva tarea</p>
          <TareaForm
            action={createTarea}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {visibles.length === 0 && !adding && (
          <EmptyState
            icon={<TasksIcon />}
            title={
              tareas.length === 0
                ? "Sin tareas todavía"
                : "No hay tareas con ese estado"
            }
            description={
              tareas.length === 0
                ? "Creá tu primer objetivo para esta PPS."
                : undefined
            }
            action={
              tareas.length === 0 ? (
                <Button size="sm" onClick={() => setAdding(true)}>
                  Nueva tarea
                </Button>
              ) : undefined
            }
          />
        )}

        {visibles.map((t) =>
          editingId === t.id ? (
            <div
              key={t.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="mb-3 text-sm font-medium">Editar tarea</p>
              <TareaForm
                tarea={t}
                action={updateTarea.bind(null, t.id)}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <TareaCard
              key={t.id}
              tarea={t}
              onEdit={() => setEditingId(t.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function FiltroChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border px-3.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-line text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function TareaCard({ tarea, onEdit }: { tarea: Tarea; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{tarea.titulo}</h2>
        <StatusPill estado={tarea.estado} />
      </div>
      {tarea.descripcion && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
          {tarea.descripcion}
        </p>
      )}
      {tarea.bloque && (
        <span className="mt-2 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
          {tarea.bloque}
        </span>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {ESTADOS.filter((e) => e !== tarea.estado).map((e) => (
          <Button
            key={e}
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() =>
              startTransition(() => setTareaEstado(tarea.id, e))
            }
          >
            Marcar {estadoLabel(e).toLowerCase()}
          </Button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={pending}
          className="text-danger hover:bg-danger-bg"
          onClick={() => {
            if (window.confirm("¿Borrar esta tarea?")) {
              startTransition(() => deleteTarea(tarea.id));
            }
          }}
        >
          Borrar
        </Button>
      </div>
    </article>
  );
}

function TareaForm({
  tarea,
  action,
  onDone,
  onCancel,
}: {
  tarea?: Tarea;
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
      aria-label={tarea ? "Editar tarea" : "Nueva tarea"}
      className="flex flex-col gap-3"
    >
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}
      <TextField
        label="Título"
        name="titulo"
        required
        defaultValue={tarea?.titulo ?? ""}
        error={fe.titulo}
      />
      <Textarea
        label="Descripción"
        name="descripcion"
        optional
        rows={2}
        defaultValue={tarea?.descripcion ?? ""}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Estado"
          name="estado"
          defaultValue={tarea?.estado ?? "pendiente"}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {estadoLabel(e)}
            </option>
          ))}
        </Select>
        <TextField
          label="Bloque"
          name="bloque"
          optional
          hint="Ej: Bloque 3"
          defaultValue={tarea?.bloque ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton size="sm">Guardar</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
