import "server-only";

import type { TemasDetectados } from "@/lib/entrevistas";

import { anthropic } from "./providers/anthropic";
import { gemini } from "./providers/gemini";
import { openai, openrouter } from "./providers/openai-compat";
import { SYSTEM, parseResumen } from "./system";
import type { Provider, ProviderId } from "./types";

export type { ProviderId } from "./types";

const ALL: Record<ProviderId, Provider> = { gemini, openrouter, openai, anthropic };

// Gemini primero (tier gratis), después el resto. Se puede sobreescribir con
// AI_SUMMARY_PROVIDER_ORDER (lista separada por comas). Si esa var está seteada,
// se respeta el orden estricto (sin rotación); si no, se rota para repartir
// carga entre los tiers gratuitos.
const DEFAULT_ORDER: ProviderId[] = ["gemini", "openrouter", "openai", "anthropic"];

function order(): ProviderId[] {
  const raw = process.env.AI_SUMMARY_PROVIDER_ORDER;
  if (!raw) return DEFAULT_ORDER;
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ProviderId => s in ALL);
  return ids.length ? ids : DEFAULT_ORDER;
}

/** Proveedores con API key configurada, en orden de preferencia. */
export function availableProviders(): Provider[] {
  return order()
    .map((id) => ALL[id])
    .filter((p) => p.configured());
}

/** ¿Hay al menos un proveedor de IA configurado en el servidor? */
export function hasSummaryProvider(): boolean {
  return availableProviders().length > 0;
}

export async function generarResumen(transcripcion: string): Promise<{
  resumen: string;
  temas: TemasDetectados;
  proveedor: ProviderId;
}> {
  const disponibles = availableProviders();
  if (disponibles.length === 0) {
    throw new Error("No hay ningún proveedor de IA configurado en el servidor.");
  }

  // Rotación: arranca en un índice que gira cada minuto y cae al siguiente si
  // uno falla (rate limit, error transitorio, etc.).
  const rotar = !process.env.AI_SUMMARY_PROVIDER_ORDER;
  const inicio = rotar
    ? Math.floor(Date.now() / 60_000) % disponibles.length
    : 0;
  const secuencia = [
    ...disponibles.slice(inicio),
    ...disponibles.slice(0, inicio),
  ];

  const errores: string[] = [];
  for (const p of secuencia) {
    try {
      const parsed = parseResumen(await p.complete(SYSTEM, transcripcion));
      return { ...parsed, proveedor: p.id };
    } catch (e) {
      errores.push(`${p.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(
    `Ningún proveedor pudo generar el resumen. ${errores.join(" · ")}`,
  );
}
