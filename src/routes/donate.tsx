import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ChevronLeft, Check, Loader2, XCircle, Smartphone } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayment";
import { SPONSOR_TIERS } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Sponsor Us — Keep Insightly Free for Learners" },
      { name: "description", content: "Sponsor Insightly from KES 100 and keep AI tutoring running for Kenyan students. Instant, secure M-Pesa payment." },
      { property: "og:title", content: "Sponsor Insightly" },
      { property: "og:description", content: "Sponsor a learner from KES 100 with a one-tap M-Pesa payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SponsorPage,
});

function SponsorPage() {
  const { user } = useAuth();
  const { stage, error, start, reset } = usePayment();
  const [amount, setAmount] = useState(200);
  const [custom, setCustom] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const busy = stage === "sending" || stage === "waiting";
  const finalAmount = custom ? Number(custom) : amount;

  const submit = async () => {
    if (!user) return toast.error("Sign in first so we can thank you properly.");
    if (!finalAmount || finalAmount < 10) return toast.error("Minimum sponsorship is KES 10.");
    if (!/^(?:\+?254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      return toast.error("Enter a valid Safaricom number, e.g. 0712 345 678");
    }
    const ok = await start({ type: "sponsorship", amount: Math.round(finalAmount), phone, message });
    if (ok) {
      toast.success("Thank you for sponsoring Insightly 💜");
      setMessage("");
    }
  };

  return (
    <AppShell>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <img src={insightlyIcon} alt="" className="h-10 w-10" />
        </div>
        <Heart className="mx-auto h-7 w-7" />
        <h1 className="mt-2 text-2xl font-bold">Sponsor Us</h1>
        <p className="mt-1 text-sm opacity-90">
          Every shilling keeps Iris tutoring learners who can't afford Pro.
        </p>
      </Card>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {SPONSOR_TIERS.map((t) => {
          const selected = !custom && amount === t.amount;
          return (
            <button
              key={t.level}
              type="button"
              onClick={() => {
                setAmount(t.amount);
                setCustom("");
              }}
              className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                selected ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-2xl leading-none">{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-lg font-bold">KES {t.amount.toLocaleString()}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{t.blurb}</p>
              </div>
              {selected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Pay with M-Pesa</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          We send a prompt to your phone — enter your PIN and you're done. No codes to copy.
        </p>

        <div className="space-y-2">
          <Label htmlFor="custom">Custom amount (optional)</Label>
          <Input
            id="custom"
            type="number"
            inputMode="numeric"
            min={10}
            placeholder="e.g. 350"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sphone">M-Pesa phone number</Label>
          <Input
            id="sphone"
            inputMode="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="font-mono"
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smsg">Message (optional)</Label>
          <Textarea
            id="smsg"
            placeholder="A note for the creator…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            rows={3}
            disabled={busy}
          />
        </div>

        <Button
          onClick={submit}
          disabled={busy || !user}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {stage === "sending" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending prompt…</>
          ) : stage === "waiting" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for your M-Pesa PIN…</>
          ) : (
            <><Heart className="mr-2 h-4 w-4" /> Sponsor KES {(finalAmount || 0).toLocaleString()}</>
          )}
        </Button>

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
            <p className="text-xs text-emerald-700">Sponsorship received — thank you! 💜</p>
          </div>
        )}
        {!user && (
          <p className="text-center text-[11px] text-muted-foreground">
            <Link to="/auth" className="text-primary underline">Sign in</Link> to sponsor.
          </p>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Thank you for supporting independent learners 🙏
      </p>
    </AppShell>
  );
}
