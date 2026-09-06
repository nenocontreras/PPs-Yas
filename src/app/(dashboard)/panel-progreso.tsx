import Link from "next/link";

import {
  CalendarIcon,
  InterviewIcon,
  LogbookIcon,
} from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HoursProgress } from "@/components/ui/hours-progress";
import { TIPO_COLOR, TIPO_LABEL } from "@/lib/calendario";
import { formatFecha } from "@/lib/dates";
import type { PanelData } from "@/lib/panel";

const TAREA_TILES = [
  { key: "pendiente", label: "Pendientes", cls: "" },
  { key: "en_curso", label: "En curso", cls: "text-warning" },
  { key: "completada", label: "Completadas", cls: "text-success" },
] as const;

export function PanelProgreso({
  nombre,
  data,
  passwordUpdated,
}: {
  nombre?: string;
  data: PanelData;
  passwordUpdated?: boolean;
}) {
  const sinDatos =
    data.jornadasCount === 0 &&
    data.tareas.pendiente + data.tareas.en_curso + data.tareas.completada ===
      0 &&
    data.proximosEventos.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {passwordUpdated && (
        <Alert tone="success">Tu contraseña se actualizó.</Alert>
      )}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {nombre ? `Hola, ${nombre}` : "Panel de progreso"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tu PPS de un vistazo.
        </p>
      </header>

      {sinDatos && (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-5 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-slate-700 dark:text-slate-200">
            <LogbookIcon className="h-5.5 w-5.5" />
          </span>
          <p className="mt-3 text-sm font-semibold">Empezá tu bitácora</p>
          <p className="mt-1 text-xs text-muted">
            Registrá tu primera jornada de práctica para empezar a sumar horas.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/bitacora">Registrar jornada</Link>
          </Button>
        </div>
      )}

      <HoursProgress horas={data.totalHoras} />

      {/* Tareas por estado */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Tareas</h2>
          <Link
            href="/tareas"
            className="text-xs text-muted hover:text-ink hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TAREA_TILES.map((t) => (
            <div
              key={t.key}
              className="rounded-xl border border-line bg-surface p-3 text-center"
            >
              <div
                className={`font-mono text-lg font-semibold tabular-nums ${t.cls}`}
              >
                {data.tareas[t.key]}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Próximos eventos */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Próximos eventos</h2>
          <Link
            href="/calendario"
            className="text-xs text-muted hover:text-ink hover:underline"
          >
            Ver agenda
          </Link>
        </div>
        {data.proximosEventos.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-muted">
            <CalendarIcon className="h-4 w-4" />
            No tenés eventos próximos en la agenda.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {data.proximosEventos.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: TIPO_COLOR[e.tipo] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {e.titulo}
                </span>
                <span className="shrink-0 text-xs capitalize text-muted">
                  {formatFecha(e.fecha)}
                </span>
                <span className="sr-only">{TIPO_LABEL[e.tipo]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Entrevistas (se completa en la Fase 6) */}
      <section className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-slate-700 dark:text-slate-200">
          <InterviewIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {data.entrevistasCount} entrevistas registradas
          </p>
          <p className="text-[11px] text-muted">
            El módulo de entrevistas se activa en la Fase 6.
          </p>
        </div>
        <Link
          href="/entrevistas"
          className="shrink-0 text-xs text-muted hover:text-ink hover:underline"
        >
          Ver
        </Link>
      </section>
    </div>
  );
}
