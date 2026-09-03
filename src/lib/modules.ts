import type { ComponentType, SVGProps } from "react";

import {
  CalendarIcon,
  EvidenceIcon,
  HomeIcon,
  InterviewIcon,
  LogbookIcon,
  SearchIcon,
  TasksIcon,
} from "@/components/icons";

export interface ModuleDef {
  /** Ruta bajo el grupo (dashboard). */
  href: string;
  /** Nombre visible completo. */
  label: string;
  /** Texto corto para la barra inferior. */
  short: string;
  /** Descripción del módulo (placeholder mientras no está implementado). */
  description: string;
  /** Fase del plan de construcción (ver CLAUDE.md) en que se implementa. */
  phase: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Módulos que aparecen en la navegación del dashboard. */
export const MODULES: ModuleDef[] = [
  {
    href: "/",
    label: "Inicio",
    short: "Inicio",
    description:
      "Panel de progreso: horas acumuladas, tareas y próximos eventos de un vistazo.",
    phase: 5,
    icon: HomeIcon,
  },
  {
    href: "/bitacora",
    label: "Bitácora",
    short: "Bitácora",
    description:
      "Registro de jornadas: fecha, horas, tareas realizadas y observaciones, con el total acumulado hacia el mínimo de 130 hs.",
    phase: 3,
    icon: LogbookIcon,
  },
  {
    href: "/tareas",
    label: "Tareas",
    short: "Tareas",
    description:
      "Objetivos y tareas con estado (pendiente / en curso / completada) y asociación a bloques de la Ficha Maestra.",
    phase: 3,
    icon: TasksIcon,
  },
  {
    href: "/evidencia",
    label: "Evidencia",
    short: "Evidencia",
    description:
      "Banco de evidencia: documentos, capturas y notas con etiquetas, guardados de forma privada.",
    phase: 4,
    icon: EvidenceIcon,
  },
  {
    href: "/calendario",
    label: "Calendario",
    short: "Agenda",
    description:
      "Vista mensual con jornadas, entregas e hitos de la práctica.",
    phase: 3,
    icon: CalendarIcon,
  },
  {
    href: "/entrevistas",
    label: "Entrevistas",
    short: "Entrev.",
    description:
      "Registro de entrevistas con transcripción en el dispositivo y resumen asistido. El audio nunca sale de tu celular.",
    phase: 6,
    icon: InterviewIcon,
  },
  {
    href: "/busqueda",
    label: "Búsqueda",
    short: "Buscar",
    description:
      "Búsqueda semántica en lenguaje natural sobre bitácora, evidencia y entrevistas.",
    phase: 7,
    icon: SearchIcon,
  },
];

export function getModuleByHref(href: string): ModuleDef | undefined {
  return MODULES.find((m) => m.href === href);
}
