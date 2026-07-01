import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BarChart3, Crown, Sparkles, ChevronRight, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreakFlame } from "@/components/StreakFlame";
import { BadgeMedal } from "@/components/BadgeMedal";
import { StudyAnalytics } from "@/components/StudyAnalytics";
import { useStore } from "@/lib/store";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { BADGES } from "@/lib/badges";
import { computeStreak } from "@/lib/streak";

export const Route = createFileRoute("/profile")({
  component: () => (
    <RequireProfile>
      <ProfilePage />
    </RequireProfile>
  ),
});

function ProfilePage() {
  const { state } = useStore();
  const { user } = useAuth();
  const { profile: dbProfile } = useProfile();
  const { info: subInfo } = useSubscription();
  const profile = state.profile!;

  const streak = computeStreak(state.tasks, state.revisionDone, state.streakSettings);
  const unlocked = new Set(state.badges.unlocked);
  const initials = (dbProfile?.display_name || profile.name || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your progress, badges & plan</p>
      </header>

      <Card className="mb-4 flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground shadow-glow">
          {dbProfile?.avatar_url ? (
            <img src={dbProfile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{dbProfile?.display_name || profile.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{profile.curriculum} · {profile.grade}</p>
        </div>
      </Card>

      {/* Streak + badges bento */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="relative col-span-2 h-full overflow-hidden border-0 bg-gradient-ocean p-5 text-primary-foreground shadow-glow">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-center gap-1.5 opacity-80">
            <Flame className="h-4 w-4" />
            <p className="text-[11px] font-medium uppercase tracking-widest">Daily Streak</p>
          </div>
          <div className="mt-2">
            <StreakFlame count={streak} size="lg" label={false} className="text-white" />
          </div>
          <p className="mt-2 text-[11px] opacity-80">
            {streak > 0 ? "Keep the flame alive 🔥" : "Do something today to start"}
          </p>
        </Card>
        <Card className="h-full overflow-hidden border bg-card p-4">
          <div className="flex items-center gap-1.5 text-primary">
            <Award className="h-4 w-4" />
            <p className="text-[10px] font-medium uppercase tracking-wide">Badges</p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{unlocked.size}</p>
          <p className="text-[10px] text-muted-foreground">/ {BADGES.length} unlocked</p>
        </Card>
      </div>

      {/* Subscription / payment */}
      {subInfo && (
        <Card
          className={`mb-4 overflow-hidden p-0 ${
            subInfo.isPro
              ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-orange-500/10"
              : subInfo.isActive
              ? "border-primary/30 bg-gradient-to-br from-primary/8 to-primary/3"
              : "border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/5"
          }`}
        >
          <div className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  subInfo.isPro
                    ? "bg-amber-500/20 text-amber-600"
                    : subInfo.isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-red-500/15 text-red-600"
                }`}
              >
                {subInfo.isPro ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {subInfo.isPro ? "Insightly Pro" : subInfo.isActive ? "Free Trial" : "Trial Expired"}
                  </h2>
                  <Badge
                    variant="secondary"
                    className={
                      subInfo.isPro
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : subInfo.isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-red-500/15 text-red-700"
                    }
                  >
                    {subInfo.isPro ? "ACTIVE" : subInfo.isActive ? "TRIAL" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {subInfo.isPro
                    ? `Renews ${subInfo.expiresAt.toLocaleDateString()}`
                    : subInfo.isActive
                    ? `${subInfo.daysLeft} day${subInfo.daysLeft === 1 ? "" : "s"} left · ends ${subInfo.expiresAt.toLocaleDateString()}`
                    : `Ended ${subInfo.expiresAt.toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {!subInfo.isPro && (
              <Link to="/go-pro">
                <Button className="w-full bg-gradient-primary text-primary-foreground">
                  <Crown className="h-4 w-4 mr-2" />
                  {subInfo.isActive ? "Upgrade to Pro" : "Reactivate — Upgrade now"}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Badges grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Badges</h2>
        <span className="text-xs text-muted-foreground">{unlocked.size}/{BADGES.length} unlocked</span>
      </div>
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {BADGES.map((b, i) => (
            <BadgeMedal key={b.id} badge={b} unlocked={unlocked.has(b.id)} index={i} />
          ))}
        </div>
      </Card>

      {/* Advanced analytics */}
      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Advanced student analytics</h2>
        </div>
        <p className="-mt-1 mb-4 text-xs text-muted-foreground">
          A detailed look at your study habits, subjects, and performance.
        </p>
        <StudyAnalytics />
      </Card>

      <Link to="/exams" className="block">
        <Card className="mb-4 flex items-center gap-3 p-4 transition-all hover:shadow-glow active:scale-[0.98]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Exam results & goals</p>
            <p className="text-xs text-muted-foreground">Track scores and long-term progress</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Card>
      </Link>
    </AppShell>
  );
}
