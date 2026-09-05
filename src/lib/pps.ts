/** Constantes reglamentarias de la PPS (Reglamento de PPS - UCSE). */
export const HORAS_MINIMO = 130;
export const HORAS_MAXIMO = 200;

/** Formatea horas con una decimal y coma decimal (es-AR): 128.5 → "128,5". */
export function formatHoras(horas: number): string {
  return horas.toLocaleString("es-AR", {
    minimumFractionDigits: horas % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}
