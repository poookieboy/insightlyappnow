import { Lock, Sprout, Rocket, Star, Crown, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReferrals } from "@/hooks/useReferrals";

/** Insightly launched in this month — accounts created within 10 months qualify as Early Supporters. */
export const LAUNCH_DATE = new Date("2026-01-01T00:00:00Z");
const EARLY_SUPPORTER_WINDOW_MONTHS = 10;

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  gradient: string;
  ring: string;
  threshold?: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Invite 4 friends who join Insightly",
    icon: Sprout,
    emoji: "🌱",
    gradient: "from-emerald-400 to-teal-600",
    ring: "ring-emerald-400/40",
    threshold: 4,
  },
  {
    id: "community-builder",
    name: "Community Builder",
    description: "Invite 10 friends who join Insightly",
    icon: Rocket,
    emoji: "🚀",
    gradient: "from-sky-400 to-indigo-600",
    ring: "ring-sky-400/40",
    threshold: 10,
  },
  {
    id: "education-champion",
    name: "Education Champion",
    description: "Invite 20 friends who join Insightly",
    icon: Star,
    emoji: "⭐",
    gradient: "from-amber-300 to-orange-600",
    ring: "ring-amber-400/40",
    threshold: 20,
  },
  {
    id: "insightly-ambassador",
    name: "Insightly Ambassador",
    description: "Invite 50 friends who join Insightly",
    icon: Crown,
    emoji: "👑",
    gradient: "from-fuchsia-400 to-purple-700",
    ring: "ring-fuchsia-400/40",
    threshold: 50,
  },
  {
    id: "early-supporter",
    name: "Early Supporter",
    description: "Joined within the first 10 months of Insightly",
    icon: Heart,
    emoji: "❤️",
    gradient: "from-rose-400 to-red-600",
    ring: "ring-rose-400/40",
  },
];

function isEarlySupporter(joinedAt: string | null): boolean {
  if (!joinedAt) return false;
  const joined = new Date(joinedAt);
  if (Number.isNaN(joined.getTime())) return false;
  const cutoff = new Date(LAUNCH_DATE);
  cutoff.setMonth(cutoff.getMonth() + EARLY_SUPPORTER_WINDOW_MONTHS);
  return joined >= LAUNCH_DATE && joined < cutoff;
}

/**
 * Unlock dates are derived from real events (referral confirmations, sign-up date),
 * so a badge can never be lost once its condition has been met.
 */
export function AchievementBadges() {
  const { referrals, count, joinedAt, loading } = useReferrals();
  if (loading) return null;

  const sorted = [...referrals].sort((a, b) => a.confirmed_at.localeCompare(b.confirmed_at));

  const items = ACHIEVEMENTS.map((a) => {
    if (a.threshold) {
      const unlocked = count >= a.threshold;
      const at = unlocked ? sorted[a.threshold - 1]?.confirmed_at ?? null : null;
      return { def: a, unlocked, at, progress: Math.min(1, count / a.threshold) };
    }
    const unlocked = isEarlySupporter(joinedAt);
    return { def: a, unlocked, at: unlocked ? joinedAt : null, progress: unlocked ? 1 : 0 };
  });

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Achievements</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {unlockedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {items.map(({ def, unlocked, at, progress }, i) => {
          const Icon = def.icon;
          return (
            <div
              key={def.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all",
                unlocked
                  ? "animate-badge-in border-transparent bg-gradient-to-br from-card to-muted/60 shadow-sm"
                  : "border-dashed opacity-70",
              )}
            >
              {unlocked && (
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
              )}
              <div
                className={cn(
                  "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white",
                  def.gradient,
                  unlocked ? cn("ring-2 ring-offset-2 ring-offset-background", def.ring) : "grayscale",
                )}
              >
                <Icon className="h-7 w-7" strokeWidth={1.6} />
                {!unlocked && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <span aria-hidden>{def.emoji}</span>
                  {def.name}
                </p>
                <p className="text-[11px] text-muted-foreground">{def.description}</p>
                {unlocked ? (
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Unlocked{at ? ` · ${new Date(at).toLocaleDateString()}` : ""}
                  </p>
                ) : def.threshold ? (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-700"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-[10px] text-muted-foreground">Awarded to our earliest members</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
