import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayment } from "@/hooks/usePayment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = {
  monthly: {
    name: "Monthly",
    price: 150,
    duration: "1 month",
  },
  sixmonth: {
    name: "6 Months",
    price: 800,
    duration: "6 months",
  },
  yearly: {
    name: "Yearly",
    price: 1600,
    duration: "1 year",
  },
} as const;

type PlanKey = keyof typeof PLANS;

export default function GoPro() {
  const navigate = useNavigate();
  const { stage, error, start, reset } = usePayment();

  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in first.");
        navigate("/auth");
        return;
      }

      setUserId(user.id);
    };

    loadUser();
  }, [navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handlePayment = async () => {
    if (!userId) {
      toast.error("Please sign in first.");
      return;
    }

    const cleanedPhone = phone.trim();

    if (!cleanedPhone) {
      toast.error("Enter your M-Pesa phone number.");
      return;
    }

    const selectedPlan = PLANS[plan];

    reset();

    const ok = await start({
      type: "subscription",
      plan,
      amount: selectedPlan.price,
      phone: cleanedPhone,
    });

    if (ok) {
      toast.success("Payment confirmed! Your subscription is now active.");
      navigate("/settings");
    }
  };

  const isProcessing =
    stage === "sending" || stage === "waiting";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">
            Upgrade to Pro
          </h1>

          <p className="mt-2 text-muted-foreground">
            Unlock your full Insightly learning experience.
          </p>
        </div>

        <div className="grid gap-4">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const currentPlan = PLANS[key];
            const selected = plan === key;

            return (
              <button
                key={key}
                type="button"
                disabled={isProcessing}
                onClick={() => setPlan(key)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      {currentPlan.name}
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {currentPlan.duration}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      KSh {currentPlan.price.toLocaleString()}
                    </p>

                    {selected && (
                      <div className="mt-1 flex items-center justify-end gap-1 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold">
                M-Pesa Payment
              </h2>

              <p className="text-sm text-muted-foreground">
                Enter the number that should receive the payment prompt.
              </p>
            </div>
          </div>

          <Input
            type="tel"
            inputMode="numeric"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isProcessing}
          />

          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isProcessing || !userId}
          >
            {stage === "sending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting payment...
              </>
            ) : stage === "waiting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for confirmation...
              </>
            ) : (
              `Pay KSh ${PLANS[plan].price.toLocaleString()}`
            )}
          </Button>

          {stage === "waiting" && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Check your phone and complete the M-Pesa prompt.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border bg-muted/30 p-5">
          <h3 className="font-semibold">
            What you get with Pro
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>✓ Full access to Insightly Pro features</li>
            <li>✓ Notes and revision tools</li>
            <li>✓ Quizzes and learning resources</li>
            <li>✓ Your subscription unlocks automatically after confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
