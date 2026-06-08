import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function TrialBanner() {
  const { info, loading } = useSubscription();
  if (loading || !info || info.isPro) return null;

  if (!info.isActive) {
    return (
      <Link
        to="/go-pro"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-500/10 to-red-600/10 p-4 text-sm shadow-sm transition-all hover:shadow-md"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-700 dark:text-red-400">Trial expired</p>
          <p className="text-[11px] text-muted-foreground">Upgrade to keep using Insightly</p>
        </div>
        <Crown className="h-4 w-4 text-red-600" />
      </Link>
    );
  }

  const urgent = info.daysLeft <= 2;
  return (
    <Link
      to="/go-pro"
      className={`mb-4 flex items-center gap-3 rounded-2xl border p-3.5 text-sm shadow-sm transition-all hover:shadow-md ${
        urgent
          ? "border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
          : "border-primary/30 bg-gradient-to-r from-primary/8 to-primary/4"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          urgent ? "bg-amber-500/20 text-amber-600" : "bg-primary/15 text-primary"
        }`}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight">
          {info.daysLeft === 0
            ? "Trial ends today"
            : info.daysLeft === 1
            ? "1 day left in your trial"
            : `${info.daysLeft} days left in your free trial`}
        </p>
        <p className="text-[11px] text-muted-foreground">Tap to upgrade — keep streaks, AI tutor & papers</p>
      </div>
      <Crown className={`h-4 w-4 ${urgent ? "text-amber-600" : "text-primary"}`} />
    </Link>
  );
}
