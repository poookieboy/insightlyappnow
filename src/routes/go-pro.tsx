import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, ChevronLeft, Check, Smartphone, Loader2, Sparkles, ShieldCheck, XCircle, Clock } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePayment } from "@/hooks/usePayment";
import { PLANS, PLAN_KEYS, PRO_FEATURES, type PlanDef } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/go-pro")({
  head: () => ({
    meta: [
      { title: "Go Pro — Insightly Study Companion" },
      { name: "description", content: "Unlock unlimited Iris AI tutoring, revision papers and analytics. Pay securely with M-Pesa from KES 150." },
      { property: "og:title", content: "Go Pro — Insightly" },
      { property: "og:description", content: "Unlock unlimited AI tutoring and revision papers. Instant M-Pesa activation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoProPage,
});

interface PaymentRow {
  id: string;
  amount: number;
  type: string;
  plan: string | null;
  status: string;
  created_at: string;
}

function GoProPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { info, refresh } = useSubscription();
  const { stage, error, start, reset } = usePayment();
  const [plan, setPlan] = useState<PlanDef["key"]>("sixmonth");
  const [phone, setPhone] = useState("");
  const [history, setHistory] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id,amount,type,plan,status,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data as PaymentRow[]) ?? []);
  };

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const pay = async () => {
    if (!/^(?:\+?254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      return toast.error("Enter a valid Safaricom number, e.g. 0712 345 678");
    }
    const ok = await start({ type: "subscription", plan, phone });
    await loadHistory();
    if (ok) {
      toast.success("Payment confirmed — Pro is active 🎉");
      await refresh();
      setTimeout(() => navigate({ to: "/home" }), 1200);
    }
  };

  const busy = stage === "sending" || stage === "waiting";

  return (
    <AppShell showTrialBanner={false}>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 overflow-hidden border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <img src={insightlyIcon} alt="" className="h-10 w-10" />
        </div>
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Crown className="h-6 w-6" /> Insightly Pro
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {info?.isPro
            ? "You're on Pro — thank you for supporting Insightly."
            : info?.isTrial
              ? `${info.daysLeft} day${info.daysLeft === 1 ? "" : "s"} left on your free trial.`
              : "Your trial has ended. Pick a plan to keep learning."}
        </p>
      </Card>

      {info?.isPro && (
        <Card className="mb-5 border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Pro is active</p>
              <p className="text-xs text-muted-foreground">
                Renews / expires {info.expiresAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {PLAN_KEYS.map((k) => {
          const p = PLANS[k];
          const selected = plan === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setPlan(k)}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                selected ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {p.badge && (
                <span className="absolute right-0 top-0 rounded-bl-xl bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {p.badge}
                </span>
              )}
              <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
              <p className="mt-1 text-2xl font-bold">KES {p.price.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{p.period}</p>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{p.tagline}</p>
              {p.savings && (
                <Badge variant="secondary" className="mt-2 bg-emerald-500/15 text-[10px] text-emerald-700">
                  {p.savings}
                </Badge>
              )}
              {selected && (
                <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Everything in Pro
        </h2>
        <ul className="space-y-2">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-5 space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Pay with M-Pesa</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your M-Pesa number and we'll send a payment prompt to your phone. Pro unlocks automatically the second
          the payment confirms — no codes to copy.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="phone">M-Pesa phone number</Label>
          <Input
            id="phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className="font-mono"
            disabled={busy}
          />
        </div>

        <Button onClick={pay} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground">
          {stage === "sending" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending prompt…</>
          ) : stage === "waiting" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for your M-Pesa PIN…</>
          ) : (
            <>Pay KES {PLANS[plan].price.toLocaleString()} with M-Pesa</>
          )}
        </Button>

        {stage === "waiting" && (
          <p className="text-center text-[11px] text-muted-foreground">
            Check your phone and enter your M-Pesa PIN. Keep this screen open.
          </p>
        )}
        {stage === "failed" && error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-xs text-destructive">{error}</p>
              <button onClick={reset} className="mt-1 text-[11px] font-medium text-primary hover:underline">
                Try again
              </button>
            </div>
          </div>
        )}
        {stage === "success" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <Check className="h-4 w-4 text-emerald-600" />
            <p className="text-xs text-emerald-700">Payment confirmed — Pro unlocked!</p>
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Payment history</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                <StatusIcon status={h.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">
                    {h.type === "sponsorship" ? "Sponsorship" : `${h.plan ?? "Pro"} plan`} — KES {Number(h.amount).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    h.status === "success"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : h.status === "pending"
                        ? "bg-amber-500/15 text-amber-700"
                        : "bg-red-500/15 text-red-700"
                  }
                >
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <Check className="h-4 w-4 text-emerald-600" />;
  if (status === "pending") return <Clock className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}
