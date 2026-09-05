import { cn } from "@/lib/cn";
import type { Enums } from "@/lib/database.types";

type Estado = Enums<"tarea_estado">;

const STYLES: Record<Estado, { label: string; box: string; dot: string }> = {
  pendiente: {
    label: "Pendiente",
    box: "bg-surface-2 text-slate-700 dark:text-slate-200",
    dot: "bg-slate-500",
  },
  en_curso: {
    label: "En curso",
    box: "bg-warning-bg text-warning",
    dot: "bg-warning",
  },
  completada: {
    label: "Completada",
    box: "bg-success-bg text-success",
    dot: "bg-success",
  },
};

export const ESTADOS: Estado[] = ["pendiente", "en_curso", "completada"];

export function estadoLabel(estado: Estado): string {
  return STYLES[estado].label;
}

export function StatusPill({
  estado,
  className,
}: {
  estado: Estado;
  className?: string;
}) {
  const s = STYLES[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        s.box,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
