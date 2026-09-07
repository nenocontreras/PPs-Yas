import { cn } from "@/lib/cn";

/**
 * Marca de la app — dirección "Monograma PPS" del sistema de diseño
 * (proyecto Claude Design "PPS App: Sistema de diseño", Logo.dc.html, 1c):
 * cuadrado con la sigla "PPS" y una barra de progreso de base (los 130 hs
 * mínimos como metáfora). Usa los tokens `--primary` / `--primary-fg`, así que
 * se invierte solo en dark. El asset equivalente para favicon / manifest está
 * en `public/icons/icon.svg` (generado por `scripts/gen-icons.mjs`).
 */
export function LogoMark({
  size = 36,
  className,
}: {
  /** Lado del cuadrado en px. Todo lo de adentro escala en proporción. */
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Gestión de PPS"
      className={cn(
        "relative inline-grid shrink-0 place-items-center bg-primary text-primary-fg",
        className,
      )}
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
    >
      <span
        className="font-semibold leading-none"
        style={{ fontSize: size * 0.3, letterSpacing: size * 0.006 }}
      >
        PPS
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{
          bottom: size * 0.16,
          width: size * 0.375,
          height: Math.max(2, size * 0.0625),
        }}
      >
        <span className="absolute inset-0 rounded-full bg-primary-fg opacity-30" />
        <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-primary-fg" />
      </span>
    </span>
  );
}

/** Lockup horizontal: marca + nombre (y bajada opcional). Header desktop, emails. */
export function LogoLockup({
  markSize = 36,
  subtitle = false,
  className,
}: {
  markSize?: number;
  subtitle?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Gestión de PPS</span>
        {subtitle && (
          <span className="text-[11px] text-muted">
            Prácticas Profesionales Supervisadas
          </span>
        )}
      </span>
    </span>
  );
}
