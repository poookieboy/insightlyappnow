import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Smartphone, ChevronLeft, Check, Loader2 } from "lucide-react";
import insightlyIcon from "@/assets/insightly-icon.png";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
});

const POCHI_NUMBER = "0740322098";
const PRESETS = [50, 100, 200, 500, 1000];

function DonatePage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("100");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return toast.error("Enter an amount");
    const cleaned = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,12}$/.test(cleaned)) {
      return toast.error("Enter the M-Pesa confirmation code");
    }
    setBusy(true);
    const { error } = await supabase.from("donations").insert({
      user_id: user?.id ?? null,
      amount: amt,
      mpesa_code: cleaned,
      phone: phone.trim() || null,
      message: message.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you for your support! 💜");
    setCode("");
    setMessage("");
  };

  return (
    <AppShell>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <Card className="mb-5 border-0 bg-gradient-primary p-6 text-center text-primary-foreground shadow-glow">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <img src={insightlyIcon} alt="" className="h-10 w-10" />
        </div>
        <Heart className="mx-auto h-8 w-8" />
        <h1 className="mt-2 text-2xl font-bold">Support Insightly</h1>
        <p className="mt-1 text-sm opacity-90">
          A small gift keeps the AI tutor running for students everywhere 💜
        </p>
      </Card>

      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Send via M-Pesa Pochi la Biashara</h2>
        </div>
        <ol className="space-y-2 text-sm">
          <Step n={1}>Open M-Pesa → <strong>Send Money</strong></Step>
          <Step n={2}>Phone: <strong className="font-mono">{POCHI_NUMBER}</strong></Step>
          <Step n={3}>Amount: <strong>any amount you choose</strong></Step>
          <Step n={4}>Enter PIN → confirm</Step>
          <Step n={5}>Paste the confirmation code below</Step>
        </ol>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <Label>Amount sent (KES)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] hover:bg-muted"
              >
                KES {v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dcode">M-Pesa confirmation code</Label>
          <Input
            id="dcode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SLK7X3Q9MN"
            maxLength={12}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dphone">Your phone (optional)</Label>
          <Input
            id="dphone"
            type="tel"
            placeholder="07XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dmsg">Message (optional)</Label>
          <Textarea
            id="dmsg"
            placeholder="A note for the creator…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        <Button
          onClick={submit}
          disabled={busy || !user}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Check className="mr-1 h-4 w-4" /> Confirm donation</>)}
        </Button>
        {!user && (
          <p className="text-center text-[11px] text-muted-foreground">
            <Link to="/auth" className="text-primary underline">Sign in</Link> to record your donation.
          </p>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Thank you for supporting independent learners 🙏
      </p>
    </AppShell>
  );
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
