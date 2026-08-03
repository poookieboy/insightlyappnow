import { useState } from "react";
import { Copy, Check, Share2, Gift, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReferrals, REFERRALS_PER_REWARD } from "@/hooks/useReferrals";

export function ReferralCard() {
  const { code, referrals, rewards, count, toNext, hoursEarned, loading } = useReferrals();
  const [copied, setCopied] = useState(false);

  if (loading || !code) return null;

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${code}`;
  const progress = ((count % REFERRALS_PER_REWARD) / REFERRALS_PER_REWARD) * 100;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — long-press the code instead");
    }
  };

  const share = async () => {
    const text = `Join me on Insightly — smarter studying with notes, revision and quizzes. Use my code ${code}: ${link}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Insightly", text, url: link });
        return;
      } catch {
        /* user dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invite message copied");
    } catch {
      toast.error("Sharing isn't available on this device");
    }
  };

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Refer & earn Premium</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{count} joined</span>
      </div>

      <div className="p-5">
        <p className="mb-3 text-xs text-muted-foreground">
          Every {REFERRALS_PER_REWARD} friends who join and verify their email give you{" "}
          <span className="font-semibold text-foreground">24 hours of Premium</span>, stacked on
          your current time.
        </p>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex-1 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-center font-display text-xl font-bold tracking-[0.3em] text-primary">
            {code}
          </div>
          <Button size="icon" variant="outline" onClick={copy} aria-label="Copy referral code">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button size="icon" onClick={share} aria-label="Share referral link">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress to next reward</span>
          <span>
            {toNext} more {toNext === 1 ? "friend" : "friends"}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-1.5 text-primary">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Referrals</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{count}</p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                Premium earned
              </span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{hoursEarned}h</p>
          </div>
        </div>

        {referrals.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Referral history
            </p>
            <ul className="space-y-1.5">
              {referrals.slice(0, 8).map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs"
                >
                  <span className="font-medium">Friend #{referrals.length - i}</span>
                  <span className="text-muted-foreground">
                    {new Date(r.confirmed_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rewards.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {rewards.map((r) => (
              <Badge
                key={r.id}
                variant="secondary"
                className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
              >
                +{r.hours}h at {r.milestone} referrals
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
