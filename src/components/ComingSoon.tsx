import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  message?: string;
  icon?: LucideIcon;
  emoji?: string;
  className?: string;
  /** Hide the "Go back" action (e.g. when embedded in a tab). */
  hideBack?: boolean;
}

/** Premium placeholder for features still being built. */
export function ComingSoon({
  title,
  message = "We're building something amazing for you. This feature is currently under development and will be available soon.",
  icon: Icon = Sparkles,
  emoji = "🚀",
  className,
  hideBack,
}: Props) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-dashed p-8 text-center animate-fade-in",
        className,
      )}
    >
      {/* Ambient glow */}
      <span className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-14 -right-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

      {/* Animated illustration */}
      <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping [animation-duration:3s]" />
        <span className="absolute inset-3 rounded-full border border-primary/30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-glow animate-badge-float">
          <Icon className="h-9 w-9" strokeWidth={1.6} />
          <span className="absolute -right-2 -top-2 text-2xl" aria-hidden>
            {emoji}
          </span>
        </div>
      </div>

      <h3 className="relative font-display text-lg font-bold">{title}</h3>
      <p className="relative mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>

      <div className="relative mt-5 flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary/50"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>

      {!hideBack && (
        <Button
          variant="outline"
          size="sm"
          className="relative mt-6 rounded-full px-5 active:scale-95"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Go back
        </Button>
      )}
    </Card>
  );
}
