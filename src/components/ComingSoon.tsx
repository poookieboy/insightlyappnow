import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  message?: string;
  icon?: LucideIcon;
  emoji?: string;
  className?: string;
}

/** Polished placeholder for features still being built. */
export function ComingSoon({
  title,
  message = "We're putting the finishing touches on this section. Thank you for growing with Insightly 💙",
  icon: Icon = Sparkles,
  emoji = "🚀",
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-dashed p-8 text-center",
        className,
      )}
    >
      <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-glow animate-badge-float">
        <Icon className="h-9 w-9" strokeWidth={1.6} />
        <span className="absolute -right-2 -top-2 text-2xl" aria-hidden>
          {emoji}
        </span>
      </div>

      <h3 className="relative font-display text-lg font-bold">{title}</h3>
      <p className="relative mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{message}</p>

      <div className="relative mt-5 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary/50"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </Card>
  );
}
