import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary:
    "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-95",
};

const SIZE: Record<Size, string> = {
  sm: "min-h-9 px-3 text-[13px]",
  md: "min-h-11 px-[1.1rem] text-sm",
  lg: "min-h-12 px-6 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  /** Renderiza el hijo (ej. un <Link>) con los estilos del botón. */
  asChild?: boolean;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  block = false,
}: {
  variant?: Variant;
  size?: Size;
  block?: boolean;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[0.625rem] border border-transparent",
    "font-semibold whitespace-nowrap select-none transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    block && "flex w-full",
  );
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(buttonClasses({ variant, size, block }), className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children as ReactNode}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-[1em] w-[1em] animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
