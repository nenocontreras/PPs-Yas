import { cn } from "@/lib/cn";
import { HORAS_MAXIMO, HORAS_MINIMO, formatHoras } from "@/lib/pps";

/**
 * Progreso de horas de práctica hacia el mínimo reglamentario (130 hs).
 * La barra vira a `--success` al cumplir el mínimo; el 100% visual es 200 hs.
 */
export function HoursProgress({
  horas,
  className,
}: {
  horas: number;
  className?: string;
}) {
  const cumplido = horas >= HORAS_MINIMO;
  const pct = Math.min(100, (horas / HORAS_MAXIMO) * 100);
  const minPct = (HORAS_MINIMO / HORAS_MAXIMO) * 100;
  const faltan = Math.max(0, HORAS_MINIMO - horas);

  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4", className)}>
      <p className="text-[13px] font-medium text-muted">Horas de práctica</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums",
            cumplido && "text-success",
          )}
        >
          {formatHoras(horas)} hs
        </span>
        <span className="text-[13px] text-muted">
          de {HORAS_MINIMO}–{HORAS_MAXIMO} hs
        </span>
      </p>

      <div
        className="relative mt-3 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(horas)}
        aria-valuemin={0}
        aria-valuemax={HORAS_MAXIMO}
        aria-label="Horas acumuladas"
      >
        <div
          className={cn(
            "h-full rounded-full",
            cumplido ? "bg-success" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
        {/* marca del mínimo reglamentario */}
        <span
          className="absolute inset-y-0 w-px bg-surface/70"
          style={{ left: `${minPct}%` }}
          aria-hidden
        />
      </div>

      <p className="mt-2 text-xs text-muted">
        {cumplido
          ? `Mínimo cumplido. Te quedan ${formatHoras(
              Math.max(0, HORAS_MAXIMO - horas),
            )} hs hasta el máximo.`
          : `Te faltan ${formatHoras(faltan)} hs para llegar al mínimo.`}
      </p>
    </div>
  );
}
