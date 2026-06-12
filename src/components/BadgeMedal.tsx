import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeDef } from "@/lib/badges";

interface Props {
  badge: BadgeDef;
  unlocked: boolean;
  /** Stagger entrance animation in a grid */
  index?: number;
}

/** Tier inferred from id ordering — purely cosmetic gradient pick. */
const TIER_GRADIENTS = [
  "from-amber-300 via-yellow-400 to-orange-500",   // gold
  "from-sky-300 via-cyan-400 to-blue-500",         // sapphire
  "from-fuchsia-300 via-pink-400 to-rose-500",     // ruby
  "from-emerald-300 via-teal-400 to-cyan-500",     // emerald
  "from-violet-300 via-purple-400 to-indigo-500",  // amethyst
  "from-orange-300 via-red-400 to-rose-600",       // fire
];

export function BadgeMedal({ badge, unlocked, index = 0 }: Props) {
  const gradient = TIER_GRADIENTS[index % TIER_GRADIENTS.length];

  return (
    <div
      className="group relative flex flex-col items-center"
      title={badge.description}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Medal disc */}
      <div
        className={cn(
          "relative h-20 w-20 rounded-full p-[3px] transition-all duration-500",
          unlocked
            ? cn("bg-gradient-to-br shadow-glow animate-medal-in", gradient)
            : "bg-muted",
        )}
      >
        {/* Outer pulsing ring (only when unlocked) */}
        {unlocked && (
          <span
            className={cn(
              "absolute -inset-1 rounded-full bg-gradient-to-br opacity-40 blur-md animate-medal-pulse",
              gradient,
            )}
          />
        )}

        {/* Inner face */}
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-full",
            unlocked
              ? "bg-gradient-to-br from-white/95 to-white/75 text-foreground"
              : "bg-muted/80 text-muted-foreground",
          )}
        >
          {/* Shine sweep */}
          {unlocked && (
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shine"
              style={{ width: "60%" }}
            />
          )}
          <span
            className={cn(
              "select-none text-3xl drop-shadow-sm transition-transform",
              unlocked ? "group-hover:scale-110" : "opacity-50",
            )}
          >
            {unlocked ? badge.emoji : <Lock className="h-6 w-6" />}
          </span>
        </div>

        {/* Ribbon */}
        {unlocked && (
          <>
            <span
              className={cn(
                "absolute -bottom-2 left-1/2 h-4 w-3 -translate-x-[120%] rotate-12 bg-gradient-to-b",
                gradient,
              )}
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%)" }}
            />
            <span
              className={cn(
                "absolute -bottom-2 left-1/2 h-4 w-3 translate-x-[20%] -rotate-12 bg-gradient-to-b",
                gradient,
              )}
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%)" }}
            />
          </>
        )}
      </div>

      <p
        className={cn(
          "mt-3 text-center text-[11px] font-semibold leading-tight",
          !unlocked && "text-muted-foreground",
        )}
      >
        {badge.name}
      </p>
    </div>
  );
}
