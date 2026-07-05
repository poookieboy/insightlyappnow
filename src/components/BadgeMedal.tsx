import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeDef } from "@/lib/badges";
import { BadgeCharacter } from "./BadgeCharacter";

interface Props {
  badge: BadgeDef;
  unlocked: boolean;
  /** Highlight the current-month monthly badge */
  highlight?: boolean;
  index?: number;
}

export function BadgeMedal({ badge, unlocked, highlight = false, index = 0 }: Props) {
  return (
    <div
      className="group relative flex flex-col items-center"
      title={badge.description}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-full transition-all",
          unlocked
            ? "animate-badge-in"
            : "opacity-80",
          highlight && !unlocked && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background animate-badge-highlight rounded-full",
        )}
      >
        {/* Sparkle burst — unlocked only */}
        {unlocked && (
          <>
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-white/20 blur-xl animate-badge-glow" />
            <Sparkles />
          </>
        )}

        {/* Idle float wrapper */}
        <div className={cn("relative", unlocked && "animate-badge-float")}>
          <BadgeCharacter
            prop={badge.prop}
            palette={badge.palette}
            unlocked={unlocked}
            size={88}
          />

          {/* Lock overlay */}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 shadow-md ring-1 ring-border">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
          )}
        </div>
      </div>

      <p
        className={cn(
          "mt-2 max-w-[6.5rem] text-center text-[11px] font-semibold leading-tight",
          !unlocked && "text-muted-foreground",
        )}
      >
        {badge.name}
      </p>
      {highlight && !unlocked && (
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
          This month
        </span>
      )}
    </div>
  );
}

function Sparkles() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full animate-badge-sparkle"
      aria-hidden="true"
    >
      <g fill="currentColor" className="text-amber-400">
        <path d="M10 20 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" />
        <path d="M88 12 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" />
        <path d="M92 78 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" />
        <path d="M8 82 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" />
      </g>
    </svg>
  );
}
