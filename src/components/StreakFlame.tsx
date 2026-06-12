import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: boolean;
}

/** Duolingo-style animated streak flame.
 *  - Flame icon pulses + glows continuously while streak > 0
 *  - Counter bounces (scale spring) whenever the streak value increases
 *  - Goes monochrome / dim when streak = 0
 */
export function StreakFlame({ count, size = "md", className, label = true }: Props) {
  const [bounce, setBounce] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 650);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  const active = count > 0;
  const sizes = {
    sm: { icon: "h-5 w-5", num: "text-lg", wrap: "gap-1.5" },
    md: { icon: "h-7 w-7", num: "text-3xl", wrap: "gap-2" },
    lg: { icon: "h-10 w-10", num: "text-5xl", wrap: "gap-3" },
  }[size];

  return (
    <div className={cn("inline-flex items-center", sizes.wrap, className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center",
          active && "animate-flame animate-flame-glow",
        )}
      >
        <Flame
          className={cn(
            sizes.icon,
            active ? "fill-orange-400 text-orange-500" : "text-muted-foreground/40",
          )}
          strokeWidth={active ? 2 : 1.5}
        />
      </span>
      <span
        className={cn(
          "font-display font-bold tabular-nums leading-none",
          sizes.num,
          active
            ? "bg-gradient-streak bg-clip-text text-transparent"
            : "text-muted-foreground",
          bounce && "animate-streak-bounce",
        )}
      >
        {count}
      </span>
      {label && (
        <span className={cn("text-xs font-medium opacity-70", !active && "text-muted-foreground")}>
          {count === 1 ? "day" : "days"}
        </span>
      )}
    </div>
  );
}
