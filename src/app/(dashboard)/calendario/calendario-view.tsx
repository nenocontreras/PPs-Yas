"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import {
  type Evento,
  TIPOS,
  TIPO_LABEL,
} from "@/lib/calendario";
import {
  WEEKDAYS_MON,
  addMonths,
  buildMonthGrid,
  formatFecha,
  formatMes,
  todayISO,
} from "@/lib/dates";
import { type FormState, OK } from "@/lib/form";

import { createEvento, deleteEvento, updateEvento } from "./actions";

export function CalendarioView({ eventos }: { eventos: Evento[] }) {
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month0: now.getMonth(),
  });
  const [selected, setSelected] = useState<string>(today);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of eventos) {
      const arr = map.get(e.fecha) ?? [];
      arr.push(e);
      map.set(e.fecha, arr);
    }
    return map;
  }, [eventos]);

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month0),
    [cursor],
  );

  const delMes = (delta: number) => {
    setCursor((c) => addMonths(c.year, c.month0, delta));
    setAdding(false);
    setEditingId(null);
  };

  const selectedEventos = byDate.get(selected) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Calendario</h1>

      <div className="mt-4 rounded-xl border border-line bg-surface p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => delMes(-1)}
            aria-label="Mes anterior"
          >
            ‹
          </Button>
          <p className="text-sm font-semibold capitalize">
            {formatMes(cursor.year, cursor.month0)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => delMes(1)}
            aria-label="Mes siguiente"
          >
            ›
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS_MON.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            const has = byDate.has(cell.iso);
            const isToday = cell.iso === today;
            const isSel = cell.iso === selected;
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => {
                  setSelected(cell.iso);
                  setEditingId(null);
                }}
                aria-pressed={isSel}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors",
                  !cell.inMonth && "text-line-strong",
                  cell.inMonth && !isSel && "text-ink hover:bg-surface-2",
                  isSel && "bg-primary font-semibold text-primary-fg",
                  !isSel && isToday && "ring-1 ring-inset ring-primary font-semibold",
                )}
              >
                {cell.day}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    has
                      ? isSel
                        ? "bg-primary-fg"
                        : "bg-primary"
                      : "bg-transparent",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold capitalize">
          {formatFecha(selected)}
        </h2>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Agregar evento
          </Button>
        )}
      </div>

      {adding && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4">
          <EventoForm
            defaultFecha={selected}
            action={createEvento}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {selectedEventos.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-line-strong bg-surface p-4 text-center text-xs text-muted">
            No hay eventos este día.
          </p>
        )}
        {selectedEventos.map((e) =>
          editingId === e.id ? (
            <div
              key={e.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <EventoForm
                evento={e}
                defaultFecha={e.fecha}
                action={updateEvento.bind(null, e.id)}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <EventoCard
              key={e.id}
              evento={e}
              onEdit={() => setEditingId(e.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function EventoCard({
  evento,
  onEdit,
}: {
  evento: Evento;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <article className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
        {TIPO_LABEL[evento.tipo]}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {evento.titulo}
      </span>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={pending}
        className="text-danger hover:bg-danger-bg"
        onClick={() => {
          if (window.confirm("¿Borrar este evento?")) {
            startTransition(() => deleteEvento(evento.id));
          }
        }}
      >
        Borrar
      </Button>
    </article>
  );
}

function EventoForm({
  evento,
  defaultFecha,
  action,
  onDone,
  onCancel,
}: {
  evento?: Evento;
  defaultFecha: string;
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
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}
      <TextField
        label="Título"
        name="titulo"
        required
        defaultValue={evento?.titulo ?? ""}
        error={fe.titulo}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Fecha"
          name="fecha"
          type="date"
          required
          defaultValue={evento?.fecha ?? defaultFecha}
          error={fe.fecha}
        />
        <Select
          label="Tipo"
          name="tipo"
          defaultValue={evento?.tipo ?? "otro"}
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </Select>
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
