import { cn } from "@/lib/utils";

interface Props {
  prop: string;
  palette: [string, string];
  unlocked: boolean;
  size?: number;
  className?: string;
}

/**
 * Character-style badge mascot rendered as SVG.
 * Consistent art language: rounded chibi body, big eyes, tiny smile.
 * Each `prop` swaps the accessory + color palette while the body stays constant.
 */
export function BadgeCharacter({ prop, palette, unlocked, size = 72, className }: Props) {
  const [light, dark] = palette;
  const skinLight = unlocked ? light : "#d1d5db";
  const skinDark = unlocked ? dark : "#6b7280";
  const face = unlocked ? "#ffffff" : "#e5e7eb";
  const eye = unlocked ? "#111827" : "#4b5563";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(
        "select-none",
        unlocked ? "drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]" : "opacity-60",
        className,
      )}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`bg-${prop}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="100%" stopColor={skinDark} />
        </radialGradient>
        <linearGradient id={`face-${prop}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={face} />
          <stop offset="100%" stopColor={unlocked ? "#f3f4f6" : "#d1d5db"} />
        </linearGradient>
      </defs>

      {/* Body / halo disc */}
      <circle cx="50" cy="50" r="46" fill={`url(#bg-${prop})`} />
      <circle cx="50" cy="50" r="46" fill="none" stroke={unlocked ? "#ffffff" : "#9ca3af"} strokeOpacity="0.35" strokeWidth="2" />

      {/* Face (chibi head) */}
      <ellipse cx="50" cy="52" rx="26" ry="24" fill={`url(#face-${prop})`} />

      {/* Cheeks (only when unlocked) */}
      {unlocked && (
        <>
          <circle cx="36" cy="58" r="3" fill={dark} opacity="0.25" />
          <circle cx="64" cy="58" r="3" fill={dark} opacity="0.25" />
        </>
      )}

      {/* Eyes */}
      <circle cx="42" cy="50" r="3" fill={eye} />
      <circle cx="58" cy="50" r="3" fill={eye} />
      {unlocked && (
        <>
          <circle cx="43" cy="49" r="1" fill="#fff" />
          <circle cx="59" cy="49" r="1" fill="#fff" />
        </>
      )}

      {/* Smile */}
      <path
        d="M43 60 Q50 66 57 60"
        stroke={eye}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Prop / accessory — anchored above head */}
      <PropIcon prop={prop} color={dark} accent={light} unlocked={unlocked} />
    </svg>
  );
}

function PropIcon({
  prop,
  color,
  accent,
  unlocked,
}: {
  prop: string;
  color: string;
  accent: string;
  unlocked: boolean;
}) {
  const c = unlocked ? color : "#6b7280";
  const a = unlocked ? accent : "#d1d5db";
  switch (prop) {
    case "check":
      return <path d="M40 22 l6 6 l14 -14" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case "triple":
      return (
        <g>
          <circle cx="38" cy="20" r="4" fill={c} />
          <circle cx="50" cy="16" r="4" fill={c} />
          <circle cx="62" cy="20" r="4" fill={c} />
        </g>
      );
    case "trophy":
      return (
        <g>
          <rect x="42" y="18" width="16" height="12" rx="2" fill={c} />
          <path d="M42 20 h-5 v4 a5 5 0 0 0 5 5 z M58 20 h5 v4 a5 5 0 0 1 -5 5 z" fill={c} />
          <rect x="46" y="28" width="8" height="4" fill={a} />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x="38" y="14" width="24" height="16" rx="2" fill={c} />
          <line x1="50" y1="14" x2="50" y2="30" stroke={a} strokeWidth="1.5" />
        </g>
      );
    case "bolt":
      return <path d="M52 12 L42 28 L50 28 L46 38 L58 22 L50 22 Z" fill={c} />;
    case "clock":
      return (
        <g>
          <circle cx="50" cy="22" r="9" fill={a} stroke={c} strokeWidth="2" />
          <path d="M50 22 v-5 M50 22 l4 3" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "sun":
      return (
        <g stroke={c} strokeWidth="2" strokeLinecap="round">
          <circle cx="50" cy="22" r="6" fill={a} />
          <line x1="50" y1="10" x2="50" y2="14" />
          <line x1="50" y1="30" x2="50" y2="34" />
          <line x1="38" y1="22" x2="42" y2="22" />
          <line x1="58" y1="22" x2="62" y2="22" />
          <line x1="41" y1="13" x2="44" y2="16" />
          <line x1="56" y1="16" x2="59" y2="13" />
        </g>
      );
    case "moon":
      return <path d="M56 12 a10 10 0 1 0 4 18 a8 8 0 0 1 -4 -18 z" fill={a} stroke={c} strokeWidth="1.5" />;
    case "rocket":
      return (
        <g>
          <path d="M50 10 L58 22 L50 28 L42 22 Z" fill={c} />
          <circle cx="50" cy="20" r="2" fill={a} />
          <path d="M46 26 L44 32 M54 26 L56 32" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "star":
      return <path d="M50 10 L54 20 L64 21 L56 28 L58 38 L50 33 L42 38 L44 28 L36 21 L46 20 Z" fill={c} stroke={a} strokeWidth="1" />;
    case "heart":
      return <path d="M50 32 C 34 22 38 10 50 18 C 62 10 66 22 50 32 Z" fill={c} />;
    case "note":
      return (
        <g>
          <rect x="40" y="12" width="20" height="18" rx="2" fill={a} stroke={c} strokeWidth="1.5" />
          <line x1="44" y1="18" x2="56" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="22" x2="54" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="26" x2="52" y2="26" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M36 28 L40 14 L46 22 L50 12 L54 22 L60 14 L64 28 Z" fill={c} />
          <rect x="36" y="28" width="28" height="4" fill={a} />
          <circle cx="50" cy="18" r="1.5" fill={a} />
        </g>
      );
    case "medal":
      return (
        <g>
          <path d="M42 10 L46 22 L54 22 L58 10" fill="none" stroke={c} strokeWidth="2" />
          <circle cx="50" cy="26" r="7" fill={c} stroke={a} strokeWidth="2" />
          <text x="50" y="29" textAnchor="middle" fontSize="8" fill={a} fontWeight="bold">1</text>
        </g>
      );
    case "globe":
      return (
        <g>
          <circle cx="50" cy="22" r="9" fill={a} stroke={c} strokeWidth="2" />
          <ellipse cx="50" cy="22" rx="9" ry="4" fill="none" stroke={c} strokeWidth="1.5" />
          <line x1="50" y1="13" x2="50" y2="31" stroke={c} strokeWidth="1.5" />
        </g>
      );
    case "target":
      return (
        <g>
          <circle cx="50" cy="22" r="9" fill={a} stroke={c} strokeWidth="2" />
          <circle cx="50" cy="22" r="5" fill="none" stroke={c} strokeWidth="2" />
          <circle cx="50" cy="22" r="2" fill={c} />
        </g>
      );
    case "snowflake":
      return (
        <g stroke={c} strokeWidth="2" strokeLinecap="round">
          <line x1="50" y1="10" x2="50" y2="34" />
          <line x1="38" y1="22" x2="62" y2="22" />
          <line x1="42" y1="14" x2="58" y2="30" />
          <line x1="58" y1="14" x2="42" y2="30" />
        </g>
      );
    case "leaf":
      return <path d="M40 30 C 40 14 60 12 62 20 C 60 34 44 34 40 30 Z" fill={a} stroke={c} strokeWidth="1.5" />;
    case "umbrella":
      return (
        <g>
          <path d="M36 24 A 14 14 0 0 1 64 24 Z" fill={c} />
          <path d="M50 24 v10 a3 3 0 0 0 6 0" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "shield":
      return <path d="M50 10 L62 14 v10 c0 8 -6 12 -12 14 c-6 -2 -12 -6 -12 -14 v-10 Z" fill={c} stroke={a} strokeWidth="1.5" />;
    case "sword":
      return (
        <g stroke={c} strokeWidth="2" strokeLinecap="round">
          <line x1="50" y1="10" x2="50" y2="30" />
          <line x1="44" y1="30" x2="56" y2="30" />
          <path d="M46 32 L54 32 L52 36 L48 36 Z" fill={c} />
        </g>
      );
    case "backpack":
      return (
        <g>
          <rect x="40" y="14" width="20" height="18" rx="4" fill={c} />
          <path d="M44 14 v-3 a6 4 0 0 1 12 0 v3" fill="none" stroke={c} strokeWidth="2" />
          <rect x="46" y="22" width="8" height="6" rx="1" fill={a} />
        </g>
      );
    case "pumpkin":
      return (
        <g>
          <ellipse cx="50" cy="24" rx="12" ry="9" fill={c} />
          <ellipse cx="44" cy="24" rx="4" ry="9" fill={c} />
          <ellipse cx="56" cy="24" rx="4" ry="9" fill={c} />
          <path d="M50 15 v-4 h3" stroke={a} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "gear":
      return (
        <g stroke={c} strokeWidth="2" fill={a}>
          <circle cx="50" cy="22" r="6" />
          <circle cx="50" cy="22" r="2" fill={c} />
          <g stroke={c} strokeWidth="3" strokeLinecap="round">
            <line x1="50" y1="12" x2="50" y2="14" />
            <line x1="50" y1="30" x2="50" y2="32" />
            <line x1="40" y1="22" x2="42" y2="22" />
            <line x1="58" y1="22" x2="60" y2="22" />
          </g>
        </g>
      );
    case "gift":
      return (
        <g>
          <rect x="40" y="18" width="20" height="14" rx="1" fill={c} />
          <rect x="40" y="18" width="20" height="4" fill={a} />
          <rect x="48" y="18" width="4" height="14" fill={a} />
          <path d="M46 18 c -4 -6 6 -8 4 0 c -2 -8 8 -6 4 0" fill="none" stroke={c} strokeWidth="1.5" />
        </g>
      );
    default:
      return <circle cx="50" cy="22" r="6" fill={c} />;
  }
}
