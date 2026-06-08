import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, ChevronLeft, Check, Smartphone, Loader2, Clock, XCircle } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/go-pro")({
  component: GoProPage,
});

const POCHI_NUMBER = "0740322098";
const PLANS = {
  monthly: { label: "Monthly", price: 150, period: "/month" },
  yearly: { label: "Yearly", price: 1500, period: "/year", savings: "Save 17%" },
} as const;

type PlanKey = keyof typeof PLANS;

interface Sub {
  id: string;
  plan: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  expires_at: string | null;
  created_at: string;
}

function GoProPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const loadSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubs((data as Sub[]) ?? []);
    setLoadingSubs(false);
  };

  useEffect(() => {
    if (user) loadSubs();
  }, [user]);

  const activeSub = subs.find(
    (s) => s.status === "approved" && s.expires_at && new Date(s.expires_at) > new Date(),
  );
  const pendingSub = subs.find((s) => s.status === "pending");

  const submit = async () => {
    if (!user) return;
    const cleaned = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,12}$/.test(cleaned)) {
      return toast.error("Enter the M-Pesa confirmation code (e.g. SLK7X3Q9MN)");
    }
    setBusy(true);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan,
      amount: PLANS[plan].price,
      mpesa_code: cleaned,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted! We'll verify within 24h.");
    setCode("");
    loadSubs();
  };

  return (
    <AppShell showTrialBanner={false}>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <img src={insightlyIcon} alt="" className="h-10 w-10" />
        </div>
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
          <Crown className="h-6 w-6" /> Insightly Pro
        </h1>
        <p className="mt-1 text-sm opacity-90">Unlock unlimited AI tutoring, exam papers & advanced analytics.</p>
      </Card>

      {activeSub && (
        <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-700">You're Pro ✨</p>
              <p className="text-xs text-muted-foreground">
                Expires {new Date(activeSub.expires_at!).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!activeSub && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            {(Object.keys(PLANS) as PlanKey[]).map((k) => {
              const p = PLANS[k];
              const selected = plan === k;
              return (
                <button
                  key={k}
                  onClick={() => setPlan(k)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                    selected ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
                  <p className="mt-1 text-2xl font-bold">KES {p.price}</p>
                  <p className="text-[11px] text-muted-foreground">{p.period}</p>
                  {"savings" in p && (
                    <Badge variant="secondary" className="mt-2 bg-emerald-500/15 text-[10px] text-emerald-700">
                      {p.savings}
                    </Badge>
                  )}
                  {selected && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Card className="mb-4 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold">Pay with M-Pesa Pochi la Biashara</h2>
            </div>
            <ol className="space-y-2 text-sm">
              <Step n={1}>Open M-Pesa → <strong>Send Money</strong></Step>
              <Step n={2}>
                Phone: <strong className="font-mono">{POCHI_NUMBER}</strong>
              </Step>
              <Step n={3}>
                Amount: <strong>KES {PLANS[plan].price}</strong>
              </Step>
              <Step n={4}>Enter PIN → confirm</Step>
              <Step n={5}>Copy the M-Pesa confirmation code from the SMS</Step>
            </ol>
          </Card>

          <Card className="mb-4 space-y-3 p-5">
            <Label htmlFor="code">M-Pesa confirmation code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SLK7X3Q9MN"
              maxLength={12}
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              We'll verify within 24h and activate your Pro plan.
            </p>
            <Button
              onClick={submit}
              disabled={busy || !!pendingSub}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : pendingSub ? "Request pending review" : "Submit for verification"}
            </Button>
          </Card>
        </>
      )}

      {!loadingSubs && subs.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Your requests</h2>
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                <StatusIcon status={s.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">
                    {s.plan} — KES {s.amount}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    s.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : s.status === "rejected"
                      ? "bg-red-500/15 text-red-700"
                      : "bg-amber-500/15 text-amber-700"
                  }
                >
                  {s.status}
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
  if (status === "approved") return <Check className="h-4 w-4 text-emerald-600" />;
  if (status === "rejected") return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-amber-600" />;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
