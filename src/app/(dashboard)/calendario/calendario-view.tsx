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
  TIPO_COLOR,
  TIPO_LABEL,
} from "@/lib/calendario";
import type { Enums } from "@/lib/database.types";
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

type Tipo = Enums<"evento_tipo">;
type Preview = { fecha: string; tipo: Tipo };

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
  const [preview, setPreview] = useState<Preview | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of eventos) {
      const arr = map.get(e.fecha) ?? [];
      arr.push(e);
      map.set(e.fecha, arr);
    }
    return map;
  }, [eventos]);

  /** Tipos distintos con evento en un día (+ el que se está por agendar). */
  const tiposDelDia = (iso: string): Tipo[] => {
    const set = new Set<Tipo>((byDate.get(iso) ?? []).map((e) => e.tipo));
    if (preview && preview.fecha === iso) set.add(preview.tipo);
    return TIPOS.filter((t) => set.has(t));
  };

  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month0),
    [cursor],
  );

  const closeForms = () => {
    setAdding(false);
    setEditingId(null);
    setPreview(null);
  };

  const delMes = (delta: number) => {
    setCursor((c) => addMonths(c.year, c.month0, delta));
    closeForms();
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
            const tipos = tiposDelDia(cell.iso);
            const isToday = cell.iso === today;
            const isSel = cell.iso === selected;
            // Tinte de la celda: color del (único) tipo del día, o del que se
            // está por agendar en ese día.
            const tintTipo =
              preview && preview.fecha === cell.iso
                ? preview.tipo
                : tipos.length === 1
                  ? tipos[0]
                  : null;

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
                style={
                  !isSel && tintTipo
                    ? { backgroundColor: `${TIPO_COLOR[tintTipo]}1f` }
                    : undefined
                }
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors",
                  !cell.inMonth && "text-line-strong",
                  cell.inMonth && !isSel && "text-ink hover:bg-surface-2",
                  isSel && "bg-primary font-semibold text-primary-fg",
                  !isSel &&
                    isToday &&
                    "font-semibold ring-1 ring-inset ring-primary",
                )}
              >
                {cell.day}
                <span className="flex h-1 items-center gap-0.5">
                  {tipos.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSel && "bg-primary-fg",
                      )}
                      style={isSel ? undefined : { backgroundColor: TIPO_COLOR[t] }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <Legend />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold capitalize">
          {formatFecha(selected)}
        </h2>
        {!adding && (
          <Button
            size="sm"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
              setPreview({ fecha: selected, tipo: "otro" });
            }}
          >
            Agregar evento
          </Button>
        )}
      </div>

      {adding && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4">
          <EventoForm
            defaultFecha={selected}
            action={createEvento}
            onPreview={setPreview}
            onDone={closeForms}
            onCancel={closeForms}
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
                onPreview={setPreview}
                onDone={closeForms}
                onCancel={closeForms}
              />
            </div>
          ) : (
            <EventoCard
              key={e.id}
              evento={e}
              onEdit={() => {
                setEditingId(e.id);
                setAdding(false);
                setPreview({ fecha: e.fecha, tipo: e.tipo });
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] text-muted">
      {TIPOS.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: TIPO_COLOR[t] }}
          />
          {TIPO_LABEL[t]}
        </span>
      ))}
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
      <span
        className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: TIPO_COLOR[evento.tipo] }}
        />
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
  onPreview,
  onDone,
  onCancel,
}: {
  evento?: Evento;
  defaultFecha: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  onPreview: (p: Preview) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [fecha, setFecha] = useState(evento?.fecha ?? defaultFecha);
  const [tipo, setTipo] = useState<Tipo>(evento?.tipo ?? "otro");

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
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value);
            if (e.target.value) onPreview({ fecha: e.target.value, tipo });
          }}
          error={fe.fecha}
        />
        <Select
          label="Tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => {
            const next = e.target.value as Tipo;
            setTipo(next);
            onPreview({ fecha, tipo: next });
          }}
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
