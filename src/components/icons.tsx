import type { SVGProps } from "react";

/**
 * Íconos de línea (24×24, stroke) para la navegación. Inline, sin dependencias.
 */
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function LogbookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

export function TasksIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h4v4H4zM4 14h4v4H4z" />
      <path d="M11 8h9M11 16h9" />
    </svg>
  );
}

export function EvidenceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M12 10v5M9.5 12.5h5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h16v16H4z" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function InterviewIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h16v11H9l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
