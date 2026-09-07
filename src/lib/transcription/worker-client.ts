"use client";

/**
 * Worker de transcripción compartido para toda la sesión de la pestaña.
 *
 * Uno solo, creado on-demand y nunca terminado: así el modelo se descarga y se
 * inicializa una única vez aunque el usuario abra varias entrevistas o reintente.
 * (Crear/terminar workers repetidamente además dejaba sesiones colgadas.)
 */
let worker: Worker | null = null;

export function getTranscriptionWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url));
  }
  return worker;
}
